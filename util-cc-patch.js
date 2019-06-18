if (typeof window.cc !== 'undefined') {
  (function(){
    if (!cc.Node.prototype.visible) {
      cc.js.getset(cc.Node.prototype, 'visible',
        function () {
          return this.opacity !== 0;
        },
        function(v) {
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
      );
    }

    /**
     * Query for node or node property or component or component property, taking `this` as referenced node
     * node.$('parent/child/grandChild<ComponentName>.propertyName')
     */
    cc.Node.prototype.$ = function (selector, defaultVal) {
      let [_, path, _comp, compName, propPath] = selector.match(/^([^<]*)(<(.*?)>)?(.[a-zA-Z0-9_.$]+)?/);
      if(propPath && propPath.charAt(0) === '.') propPath = propPath.substr(1);
      if (path) {
        let nodes = cc.findAll(path, this);
        const result = nodes.map(node => {
          if (!node) return null;
          if (compName) {
            const comp = node.getComponent(compName);
            if (comp) {
              if (propPath) {
                return get(comp, propPath, defaultVal);
              } else {
                return comp;
              }
            } else {
              return null;
            }
          } else {
            if (propPath) {
              return node.$(propPath, defaultVal);
            } else {
              return node;
            }
          }
        });
        if (result && !result.length) return null;
        return result.length === 1 ? result[0] : result;
      } else {
        if (this instanceof cc.Scene) {
          const root = this.getChildren()[0];
          return cc.$(`${root.name}${selector}`);
        } else {
          return this.getComponent(compName);
        }
      }
    };

    /**
     * A modification of cc.find. return an array of matched nodes
     * @param   {String}  path
     * @param   {cc.Node}  referenceNode
     * @return  {Array}
     */
    cc.findAll = function (path, referenceNode) {
      if (path == null) {
        cc.errorID(5600);
        return null;
      }
      if (!referenceNode) {
        var scene = cc.director.getScene();
        if (!scene) {
          if (CC_DEV) {
            cc.warnID(5601);
          }
          return null;
        }
        else if (CC_DEV && !scene.isValid) {
          cc.warnID(5602);
          return null;
        }
        referenceNode = scene;
      } else if (CC_DEV && !referenceNode.isValid) {
        cc.warnID(5603);
        return null;
      }

      var match = referenceNode;
      var startIndex = (path[0] !== '/') ? 0 : 1; // skip first '/'
      var nameList = path.split('/');
      var ret = [];
      // parse path
      for (var n = startIndex; n < nameList.length; n++) {
        var name = nameList[n];
        var children = match._children;
        match = null;
        for (var t = 0, len = children.length; t < len; ++t) {
          var subChild = children[t];
          if (subChild.name === name) {
            match = subChild;
            ret.push(subChild);
          }
        }
        if (!match) {
          break;
        }
      }
      return ret.filter(n => n.name === name);
    };

    /**
     * Select all nodes matched selector and return a proxy object
     * @param   {String|Array}  selector  selector or node array
     * @return  {Proxy<cc.Node[]>}
     */
    cc.$all = function (selector) {
      const eles = Array.isArray(selector) ? selector : cc.$(String(selector));
      const proxy = new Proxy(eles, {
        get (target, name) {
          if (typeof target[0][name] === 'function') {
            return function () {
              return target.map(n => n[name].apply(n, arguments));
            };
          } else {
            return target.map(n => n[name]);
          }
        },
        set (target, name, value, receiver) {
          target.map(n => n[name] = value)
          return value;
        }
      });
      return proxy;
    };

    /**
     * Query for node/node property/component/component property taking game scene as referenced node
     * cc.$('parent/child/grandChild<ComponentName>.propertyName')
     */
    cc.$ = function (selector, defaultVal) {
      return cc.director.getScene().$(selector, defaultVal);
    };

    cc.Node.prototype.$set = function (a, b) {
      const len = arguments.length;
      if (!len) return this;
      if (len === 1) {
        Object.assign(this, a);
      } else if (typeof a === 'string'){
        this[a] = b;
      }
      return this;
    };

    const SerializeProps = [
      //identity
      'name',
      'active',
      //position, dimesion
      'x', 'y', 'width', 'height', 'zIndex',
      //prepresentation
      'color', 'opacity',
      //transformation
      'anchorX', 'anchorY',
      'angle', 'eulerAngles',
      'scale', 'scaleX', 'scaleY',
      'skewX', 'skewY'
    ];

    const saveState = cc.Node.prototype.$saveState = function (name, extraProps) {
      if (!this.__states) this.__states = {};
      const s = this.__states[name] = {};
      saveState.SerializeProps.forEach(key => {
        s[key] = this[key];
      });
      if (Array.isArray(extraProps)) {
        extraProps.forEach(key => s[key] = this[key]);
      } else if (typeof extraProps === 'string') {
        s[extraProps] = this[extraProps];
      }
      return this;
    };
    cc.Node.prototype.$restoreState = function (name) {
      if (!this.__states) this.__states = {};
      const s = this.__states[name];
      if (s) this.$set(s);
      return this;
    };

    cc.Node.prototype.$clearState = function (name) {
      if (!this.__states) this.__states = {};
      const s = this.__states[name];
      delete this.__states[name];
      return this;
    };

    cc.Node.prototype.$getState = function (name, clear = false) {
      if (!this.__states) this.__states = {};
      const s = this.__states[name];
      if (clear) delete this.__states[name];
      return s;
    };

    cc.Node.prototype.$saveState.SerializeProps = SerializeProps;

    // simplified lodash/get
    function get(o, path, v){
      if (typeof o === 'undefined') return v;
      let props = path.split('.');
      if (props.length === 0)return v[path];
      for (var t = o,i = 0;i < props.length; ++i){
        t = t[props[i]]
        if(typeof t ==='undefined') return v;
      }
      return t;
    }
  })();
}