# layui-dropdown-tree

## 基于layui的下拉多选树组件，具体用法见index.html

## 参数说明
```js
dropdownTree({
  // 需要渲染的根元素
  el: '#region2',
  // 是否只选择叶子节点
  onlyLeaf: false,
  // 数据中用来显示在标签中的字段
  nodeProps: {
    label: 'label'
  },
  // 参数同layui的tree组件
  tree: {
    data: treeData
  }
})
```

