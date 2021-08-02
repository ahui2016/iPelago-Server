// 函数名 m 来源于 Mithril, 也可以理解为 make 的简称，用来创建一个元素。
export function m(name) {
    if (typeof name == 'string') {
        return $(document.createElement(name));
    }
    return name.view();
}
// 函数名 cc 意思是 create a component, 用来创建一个简单的组件。
export function cc(name, id, elements) {
    if (!id) {
        id = `r${Math.round(Math.random() * 100000000)}`;
    }
    const vnode = m(name).attr('id', id);
    if (elements) {
        vnode.append(elements);
    }
    return {
        id: '#' + id,
        raw_id: id,
        view: () => vnode,
        elem: () => $('#' + id)
    };
}