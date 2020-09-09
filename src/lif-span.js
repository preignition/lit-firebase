import { LitElement, html, css } from 'lit-element';
import { nothing, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import DOMPurify from 'dompurify';
import { default as FirebaseDatabase } from './lif-database-mixin.js';

const inner = (content) => {
  if (!content) {
    return html`
      ${nothing}
    `;
  }

  return html`
    ${unsafeHTML(DOMPurify.sanitize(content))}
  `;
};

class LifSpan extends FirebaseDatabase(LitElement) {

  
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
      },

      /*
       * a `format` taking value as parameter
       */
      format: {
        type: Function
      },

      /*
       * `inner` when true, inject hml
       */
      inner: {
        type: Boolean,
      },


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
        this.exists ?  this.renderValue() : html `<span part="default">${this.defaultValue}</span>`;
  }

  renderValue() {
    return this.inner ? inner(this.format(this.value)) : html `<span part="value">${this.format(this.value)}</span>`;
  }

  constructor() {
    super();
    this.format = (value) => value;
    this.defaultValue = '';
    this.errorValue = '⚠';
    this.inner = false;
    this.loadingValue = '...'
  }

  disconnectedCallback() {
    if (this.ref) {
      this.ref.off('value', this.onValue, this);
    }
    super.disconnectedCallback()
  }

  update(props) {
    this.log && console.info('update document props', props.keys());
    if (props.has('ref')) {
      this.__setRef(this.ref, props.get('ref'))
    }
    super.update(props);
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
    this.__remote = snap.val();
    this.loading = false; 
    this.log && console.info('data from db', this.__remote) 
    if (Object(this.__remote) === this.__remote) {
      this.log && console.warn('expecting a primitive, got an object', this.path)
      this.value = this.errorValue;
      return;
    }
    this.value = this.__remote;
    this.exists = this.__remote !== null;
    this.dispatchValue();
  }
}

export default LifSpan;
customElements.define('lif-span', LifSpan);
