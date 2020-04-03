import { LitElement, html, css } from 'lit-element';
import { default as FirebaseDatabase } from './lit-firebase-database-mixin.js';

class LitFirebaseSpan extends FirebaseDatabase(LitElement) {

  static get styles() {
    return css `
    :host {
      display: inline;
    }
    
    /*
    :host::before,
    :host::after {
      content: " ";
      display: inline-block;
    }
    */
    `;
  }

  static get properties() {
    return {
      ...super.properties,

      /*
       * `defaultValue` value to display when no data
       */
      defaultValue: {
        type: String,
        attribute: 'default-value'
      },

      /*
       * `loadingValue` value to display when loading
       */
      loadingValue: {
        type: String,
        attribute: 'loading-value'
      },

      errorValue: {
        type: String, 
        attribute: 'error-value'
      },

      value: {
        type: String
      },

      exists: {
        type: Boolean
      },

      loading: {
        type: Boolean
      }


    }
  }

  // Note(cg): we want to render value in light dom so that 
  // textContent work on parent elements.
  createRenderRoot() {
    return this;
  }

  render() {
    return this.loading ? 
        html `<span part="loading">${this.loadingValue}</span>` :
        this.exists ? html `<span part="value">${this.value}</span>` :
          html `<span part="default">${this.defaultValue}</span>`;
  }

  constructor() {
    super();
    this.defaultValue = 'no value';
    this.errorValue = 'problem with value';
    this.loadingValue = 'loading...'
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this.ref) {
      this.ref.off('value', this.onValue, this);
    }
  }

  update(props) {
    super.update(props);
    this.log && console.info('update document props', props.keys());
    if (props.has('ref')) {
      this.__setRef(this.ref, props.get('ref'))
    }
  }

  __setRef(ref, old) {
    if (old) {
      this.__remote = undefined;
      this.value = undefined;
      old.off('value', this.onValue, this);
    }
    if (ref) {
      this.loading = true;
      this.exists = null;
      this.value = undefined;
      ref.on('value', this.onValue, this.onError, this);
    }
  }

  onValue(snap) {
    super.onValue(snap);
    this.loading = false;  
    if (Object(this.__remote) === this.__remote) {
      this.log && console.warn('expecting a primitive, got an object', this.path)
      this.value = this.errorValue;
      return;
    }
    this.value = this.__remote;
    this.exits = !!this.value;
    this.dispatchValue();
  }
}

export default LitFirebaseSpan;
customElements.define('lit-firebase-span', LitFirebaseSpan);
