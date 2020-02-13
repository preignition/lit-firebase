import { UpdatingElement, css } from 'lit-element';
import { default as FirebaseDatabase } from './lit-firebase-database-mixin.js';

class  LitFirebaseDocument extends FirebaseDatabase(UpdatingElement) {

   //  static get styles() {
   //    return [
   //      css `
   //      :host {
   //        display: none
   //      }`
   //    ];
   // }

  static get properties() {
    return {
      ...super.properties,

      /*
       * `data` data to set at db level
       */
      data: {
        type: Object
      },
    }
  }

    disconnectedCallback() {
      super.disconnectedCallback()
      if(this.ref) {
         this.ref.off('value', this.onValue, this);
      }
    }

    update(props) {
      super.update(props);
      this.log && console.info('update document props', props.keys());
      if(props.has('ref')) {
        this.__setRef(this.ref, props.get('ref'))
      }
      if(props.has('data')) {
        this.__setData(this.data)
      }
    }

    __setData(data) {
      
      const setData = (value) => this.ref.set(value).catch( e => this.onError(e))
       
      // Note(cg): only set data once __remote is known.
      if(this.__remote === undefined) {
        this.addEventListener('data-changed', () => {setData(data)}, {once: true})
        return;
      }
      setData(data);
    }
    
    __setRef(ref, old) {
      if(old) {
        this.__remote = undefined;
        old.off('value', this.onValue, this);
      }
      if(ref) {
        ref.on('value', this.onValue, this.onError,this);
      }
    }

    onValue(snap) {
      this.__remote = snap.val();
      this.log && console.info('read value', this.__remote);
      this.dispatchEvent(new CustomEvent('data-changed', {detail: {value: this.__remote}, bubbles: true, composed: true})); 
    }
}

// Register the new element with the browser.
customElements.define('lit-firebase-document',  LitFirebaseDocument);