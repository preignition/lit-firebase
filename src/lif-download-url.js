import { UpdatingElement } from 'lit-element';
import FirebaseApp from './lif-app-mixin.js';
import pathReady from './pathReady.js';

class LifDownloadUrl extends FirebaseApp(UpdatingElement) {

  static get properties() {
    return {
      ...super.properties,

      path: {
        type: String
      }

    }
  }


  updated(props) {
    if (props.has('path') || props.has('apps')) {
      this.getUrl();
    }
    super.updated();
  }

  getUrl() {
    if (this.path && this.app && pathReady(this.path)) {
      // Create a reference to the file we want to download
      const ref = this.app.storage().ref(this.path);

      this.error = null;
      // Get the download URL
      ref.getDownloadURL()
        .then(url => {
          this.url = url;
          this.dispatchEvent(new CustomEvent('url-changed', { detail: { value: this.url } }));
        })
        .catch((error) => {
          this.url = '';
          this.dispatchEvent(new CustomEvent('url-changed', { detail: { value: this.url } }));

          if (this.onError(error));
          // A full list of error codes is available at
          // https://firebase.google.com/docs/storage/web/handle-errors
          switch (error.code) {
            case 'storage/object-not-found':
              this.error = 'File does not exist';
              break;

            case 'storage/unauthorized':
              this.error = 'User doesn\'t have permission to access the object';
              break;

            case 'storage/canceled':
              this.error = 'User canceled the upload'
              break;

            case 'storage/unknown':
              this.error = 'An unknown error occurred'
              break;
          }
        })
    }

  }

}

export default LifDownloadUrl;

// Register the new element with the browser.
customElements.define('lif-download-url', LifDownloadUrl);
