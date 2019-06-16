if (typeof window.cc !== 'undefined') {
  Object.defineProperties(cc.Node.prototype, {
    visible: {
      configurable: true,
      enumerable: false,
      get() {
        return this.opacity !== 0;
      },
      set(v) {
        if (typeof this.__opacity === 'undefined') {
          // save original opacity
          this.__opacity = this.opacity;
        }
        if (v) {
          // restore saved opacity
          this.opacity = this.__opacity;
          delete this.__opacity;
        } else {
          this.opacity = 0;
        }
      }
    }
  });
}