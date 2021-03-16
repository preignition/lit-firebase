/**
 * set firebase app from appName
 *
 * @param {LitElement} baseElement - the LitElement to extend
 */
export const appMixin = (baseElement) => class extends baseElement {

  static get properties() {
    return {
      ...super.properties,

      app: {
        type: Object,
      },

      appName: {
        type: String,
        attribute: 'app-name'
      },

      /*
       * `log` true to enable logging
       */
      log: {
        type: Boolean,
      },
    }

  }

  constructor() {
    super();
    this.appName = '';
  }

  update(props) {
    super.update(props);
    if (props.has('appName') && (!this.app || this.app.name !== this.appName || (this.appName === '' && this.app.name !== '[DEFAULT]'))) {
      if(firebase) {
        this.app = firebase.app(this.appName);
      }
      else {
        window.addEventListener('firebase-app-initialized', () => {
           this.app = firebase.app(this.appName);   
        }, {once: true})
      }
    }
  }


  onError(err) {
    this.log && console.error(err);
    this.dispatchEvent(new CustomEvent('error', { detail: err }));
  }
}

export default appMixin;
