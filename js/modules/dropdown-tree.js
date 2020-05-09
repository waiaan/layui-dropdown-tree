layui.define(['tree', 'laytpl'], function (exports) {
  // 
  if (!Array.prototype.filter) {
    Array.prototype.filter = function (func, thisArg) {
      'use strict';
      if (!((typeof func === 'Function' || typeof func === 'function') && this))
        throw new TypeError();

      var len = this.length >>> 0,
        res = new Array(len), // preallocate array
        t = this, c = 0, i = -1;
      if (thisArg === undefined) {
        while (++i !== len) {
          // checks to see if the key was set
          if (i in this) {
            if (func(t[i], i, t)) {
              res[c++] = t[i];
            }
          }
        }
      }
      else {
        while (++i !== len) {
          // checks to see if the key was set
          if (i in this) {
            if (func.call(thisArg, t[i], i, t)) {
              res[c++] = t[i];
            }
          }
        }
      }

      res.length = c; // shrink down array to proper size
      return res;
    };
  }

  if (!Function.prototype.bind) (function () {
    var slice = Array.prototype.slice;
    Function.prototype.bind = function () {
      var thatFunc = this, thatArg = arguments[0];
      var args = slice.call(arguments, 1);
      if (typeof thatFunc !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - ' +
          'what is trying to be bound is not callable');
      }
      return function () {
        var funcArgs = args.concat(slice.call(arguments))
        return thatFunc.apply(thatArg, funcArgs);
      };
    };
  })();
  // 

  // 
  var traverseNode = function (node, i, arr, cb) {
    cb(node, i, arr);
    if (node.children) {
      var children = node.children;
      for (var i = 0; i < children.length; i++) {
        var childNode = children[i];
        traverseNode(childNode, i, children, cb)
      }
    }
  }

  var traverseTree = function (tree, cb) {
    for (var i = 0; i < tree.length; i++) {
      traverseNode(tree[i], i, tree, cb)
    }
  }
  // 

  var laytpl = layui.laytpl;
  var tree = layui.tree;
  var $ = layui.jquery;

  var defaultOpt = {
    nodeProps: {
      label: 'label'
    },
    tree: {
      showCheckbox: true
    },
    onlyLeaf: true
  }

  var DropdownTree = function (id, options) {
    this.root = null;
    this.tree = null;
    this.id = id;
    this.options = null;
    this.inputValues = [];
    this.container = $('<div class="dropdown-tree-container" data-tree-id="' + id + '"></div>');
    this.dropdownWrapper = $('<div class="dropdown-tree-wrapper"></div>');
    this.inputBox = $('<div class="dropdown-tree-inputbox"></div>');
    this.dropdownWrapperShow = false;
    this.init(options);
  }

  DropdownTree.prototype = {
    constructor: DropdownTree,
    init: function (options) {
      this.options = $.extend(true, { tree: { elem: this.dropdownWrapper, id: this.id } }, defaultOpt, options);
      var el = this.options.el;
      this.root = typeof el === 'string' ? $(el) : el;
      this.renderLayer();
      this.bindEvents();
      this.renderTree();
      this.renderInputBox(this.tree.getChecked(this.id));
    },
    renderLayer: function () {
      // container.attr('data-id',this.treeId)
      this.container.append(this.inputBox);
      this.container.append(this.dropdownWrapper);
      this.root.append(this.container);
    },
    hideDropDownWrapper: function (e) {
      this.dropdownWrapper.hide();
      this.dropdownWrapperShow = false;
    },
    showDropDownWrapper: function (e) {
      this.dropdownWrapper.show();
      this.dropdownWrapperShow = true;
    },
    handleClickEvent: function (e) {
      var target = $(e.target);
      if (target[0] === this.inputBox[0]) {
        this.toggleDropDownWrapper(e)
      } else if (this.inputBox.find(target).length > 0 && target.hasClass('dropdown-input-del-icon') && (target.attr('data-id'))) {
        this.delTag(target.attr('data-id'))
      } else if (this.dropdownWrapperShow && e.target !== this.dropdownWrapper[0] && this.dropdownWrapper.find(e.target).length < 1) {
        this.hideDropDownWrapper(e)
      }
    },
    toggleDropDownWrapper: function (e) {
      // e.stopPropagation();
      // for (var i = 0; i < instances.length; i++) {
      //   var _d = instances[i];
      //   if (_d.id === this.id) {
      //     continue;
      //   }
      //   _d = instances[i].instance;
      //   if (_d.dropdownWrapper !== this.dropdownWrapper && _d.dropdownWrapper.is(':visible')) {
      //     _d.dropdownWrapper.hide();
      //   }
      // }
      this.dropdownWrapperShow ? this.hideDropDownWrapper() : this.showDropDownWrapper();
    },
    bindEvents: function () {
      var _self = this;
      $(document).on('click', this.handleClickEvent.bind(_self));
    },
    renderTree: function () {
      var _option = this.options.tree;
      this.injectTreeFns(_option);
      this.tree = tree.render(_option);
    },
    injectTreeFns: function (options) {
      var _self = this;
      if ('oncheck' in options && typeof options.oncheck === 'function') {
        var _fn = options.oncheck
        options.oncheck = function (obj) {
          var checkedVals = _self.tree ? _self.tree.getChecked(this.id) : [];
          _fn(obj);
          _self.renderInputBox(checkedVals);
        }
      } else {
        options.oncheck = function (obj) {
          var checkedVals = _self.tree ? _self.tree.getChecked(this.id) : [];
          _self.renderInputBox(checkedVals);
        }
      }
    },
    getCheckedVals: function (values) {
      var checkedVals = []
      var onlyLeaf = this.options.onlyLeaf
      traverseTree(values, function (_item) {
        if (onlyLeaf && _item.children && _item.children.length > 0) {
          return;
        }
        checkedVals.push(_item);
      })
      this.inputValues = checkedVals;
      return checkedVals;
    },
    renderInputBox: function (values) {
      var checkedVals = this.getCheckedVals(values);
      var label = this.options.nodeProps.label;
      var html = '';
      var inputTagItemTpl = '<span class="dropdown-input-tag-item" title="{{d.data.' + label + '}}">{{d.data.' + label + '}}<i class="layui-icon layui-icon-delete dropdown-input-del-icon" data-id="{{d.data.id}}" data-index="{{d.index}}"></i></span>';
      for (var i = 0; i < checkedVals.length; i++) {
        html += laytpl(inputTagItemTpl).render({ data: checkedVals[i], index: i });
      }
      this.inputBox.html(html);
    },
    delTag: function (id) {
      this.setUnChecked(id)
    },
    setUnChecked: function (id) {
      this.dropdownWrapper.find('[data-id=' + id + ']').find('.layui-form-checkbox.layui-form-checked').click();
    }
  }

  var id = 0

  var instances = []

  function createInstance (option) {
    var _id = 'd' + id;
    var d = new DropdownTree(_id, option);
    instances.push({
      id: _id,
      instance: d
    })
    id++;
    return d;
  }

  exports('dropdownTree', createInstance)

})
