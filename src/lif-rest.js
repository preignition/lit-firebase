import { UpdatingElement } from 'lit-element';
import appMixin from './lif-app-mixin'

class LifRest extends appMixin(UpdatingElement) {


  static get properties() {
    return {
      ...super.properties,
      path: {
        type: String
      }
    };
  }

  get data() {
    return this.__remote;
  }

  set data(value) {}
  
  get projectId() {
    return this.app?.options?.projectId;
  }

  update(props) {
    super.update(props);
    if (props.has('path')) {
      this.__fetchData(this.path);
    }
  }

  __fetchData(path) {
    if (path) {
      return fetch(`https://${this.projectId}.firebaseio.com${path}.json`)
        .then(async data => {
          this.__remote = await data.json();
          this.dispatchEvent(new CustomEvent('data-changed', { detail: { value: this.__remote } }));
        })
        .catch(e => {
          return this.onerror(e);
        })
    }
  }


}
customElements.define('lif-rest', LifRest);