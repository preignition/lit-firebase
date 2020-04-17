/**
 * ##  Resizable
 * 
 * handles size and resizing
 * 
 * @memberof MultiChart.mixin
 * @polymer
 * @mixinFunction
 */


const networkStatusSubscribers = [];

function notifySubscribers() {
  for (let i = 0; i < networkStatusSubscribers.length; ++i) {
    networkStatusSubscribers[i].refreshNetworkStatus();
  }
}

window.addEventListener('online', notifySubscribers);
window.addEventListener('offline', notifySubscribers);

const AppNetworkStatusBehavior = superClass => {

  /*
   * @polymer
   * @mixinClass
   */
  class Mixin extends superClass {

    // static get properties() {

    //   return {

    //     ...super.properties,

    //     *
    //      * True if the browser is online, and false if the browser is offline
    //      * matching the HTML browser state spec.
    //      *
    //      * @type {Boolean}
         
    //     _online: {
    //       type: Boolean
    //     }

    //   };
    // }

    connectedCallback() {
      super.connectedCallback();
      networkStatusSubscribers.push(this);
      this.refreshNetworkStatus();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      const index = networkStatusSubscribers.indexOf(this);
      if (index < 0) {
        return;
      }
      networkStatusSubscribers.splice(index, 1);
    }

    /**
     * Updates the `online` property to reflect the browser connection status.
     */
    refreshNetworkStatus() {
      this._online = window.navigator.onLine
    }

  }

  return Mixin;
};

export default AppNetworkStatusBehavior;
