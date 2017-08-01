//Vue类
function Vue (options) {
  this.data = options.data
  this.el = options.el

  this.proxyData = (vm, name, val) => {
    // 为每一个代理数据设置一个发布者
    let pub = new Pub()
    Object.defineProperty(vm,name, {
      get () {
        // compile时标记target,将订阅者入栈
        if (Pub.target) {
          pub.addSub(Pub.target)
          console.log('push into array: ', name, val)
        }
        return val
      },
      set (newVal) {
        if (newVal !== val) {
          // data中的数据变化时,通知所有订阅者同步变化
          val = newVal
          console.log(`update val: ${val}`)
          pub.notify()
        }
      }
    })
  }
  this.observe = (obj, vm) => {
    Object.keys(obj).forEach((name) => {
      this.proxyData(vm, name, vm.data[name])
    })
  }
  this.render = () => {
    let target = document.querySelector(this.el)
    let fragement = parseHTML(this)
    target.appendChild(fragement)
  }
  //1.代理数据 => 为每个数据给定一个pub,收集订阅者
  this.observe(this.data, this)
  //2.渲染模板
  this.render()
}

// 订阅者
/**
 * 
 * @param {订阅者} vm 
 * @param {监听的data属性名字} name 
 */
function Watcher (vm, name, node) {
  Pub.target = this
  this.name = name
  this.node = node
  this.vm = vm
  this.get = () => {
    this.value = this.vm[this.name]
    // console.log('value:', this.value)
  }
  this.update = () => {
    this.get()
    this.node.nodeValue = this.value
  }
  this.update()
  Pub.target = null
}

// 发布者
function Pub () {
  this.subs = []
  this.addSub = (subscriber) => {
    this.subs.push(subscriber)
  }
  this.notify = () => {
    // 发布通知,所有订阅者更新视图
    console.log('UPDATE')
    this.subs.forEach((sub) => {
      sub.update()
    })
  }
}
// 全局变量
Pub.prototype.target = null

// compile 只在vue初始化中执行一次
let compile = (node, vm) => {
  let reg = /\{\{(.*)\}\}/

  if (node.nodeType === 1) { // Element
    let attr = node.attributes
    for (let i = 0; i< attr.length; i++) {
      if (attr[i].nodeName === 'v-model') {
        node.addEventListener('keyup', (e) => {
          vm[attr[i].nodeValue] = e.target.value //触发set函数
        })
        node.value = vm[attr[i].nodeValue]
      }
    }
  } else if (node.nodeType === 3) { // TextNode
    if (reg.test(node.nodeValue)) {
      let name = RegExp.$1
      name = name.trim()
      let watcher = new Watcher(vm, name, node)
    }
  }
}

// 解析HTML模板
/**
 * vm: Vue示例对象
 * fragement: 劫持node子节点后的DocumentFragment
 */
let parseHTML = (vm) => {
  let _node = document.querySelector(vm.el)
  let fragement = document.createDocumentFragment()
  let element = null
  while (element = _node.firstChild) {
    // 取出父节点中的每一个子节点,进行编译，将编译结果装入容器
    compile(element, vm)
    fragement.appendChild(element)
  }
  return fragement
}



// 运行
let vm = new Vue({
  data: {
    text: 'hello world',
    plus: 1
  },
  el: '#app'
})
