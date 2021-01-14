import { UpdatingElement } from 'lit-element';
import { default as FirebaseDatabase } from './lif-database-mixin.js';

class LifDocument extends FirebaseDatabase(UpdatingElement) {

  static get properties() {
    return {
      ...super.properties,
    }
  }

  get data() {
    return this.__remote;
  }

  set data(value) {
    if (value === undefined) { return }
    const setData = (val) => {
      if (val !== this.__remote || (val === Object(val) && JSON.stringify(val) !== JSON.stringify(this.__remote))) {
        this.log && console.info('settings value to remote', val);
        this.ref.set(val)
          .catch(e => this.onError(e));
      }
    }

    // Note(cg): only set data once __remote is known.
    if (this.__remote === undefined) {
      this.addEventListener('data-changed', () => { 
        // Note(cg): override persisted data only if remote is null.
        if(this._remote === null) {
          setData(value);
        }}, { once: true })
      return;
    }
    setData(value);
  }

  disconnectedCallback() {
    if (this.ref) {
      this.ref.off('value', this.onValue, this);
    }
    super.disconnectedCallback();
  }

  update(props) {
    if (this.log) {
      console.info('update query props');
      for (const item of props) console.info(item);
    }
    if (props.has('ref')) {
      this.__setRef(this.ref, props.get('ref'))
    }
    super.update(props);
  }

  __setRef(ref, old) {
    if (old) {
      this.__remote = undefined;
      old.off('value', this.onValue, this);
    }
    if (ref) {
      ref.on('value', this.onValue, this.onError, this);
    }
  }

  onValue(snap) {
    this.__remote = snap.val();
    this.log && console.info('read value', this.__remote);
    this.dispatchValue();

  }
}

export default LifDocument;

// Register the new element with the browser.
customElements.define('lif-document', LifDocument);
