/**
 * Mixin dispatching a `exists-changed` event when data exists on remote
 */

export const existsMixin = (baseElement) => class extends baseElement {

  /**
   * get whether data exists on remote or not
   * @return {Boolean} true if exists, false otherwise
   */    
  getExistsValue() {
    return !(this.__remote === undefined || this.__remote === null)
  }

  /**
   * dispatch a exists-changed event if value of exists has changed
   */
  checkExists() {
     const old = this.__exists;
     this.__exists = this.getExistsValue()

     if(old !== this.__exists) {
        this.dispatchEvent(new CustomEvent('exists-changed', {detail: {value: this.__exists}, bubbles: true, composed: true})); 
     }
  }

}

export default existsMixin;

