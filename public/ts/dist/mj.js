/**
 * 函数名 m 来源于 Mithril, 也可以理解为 make 的简称，用来创建一个元素。
 */
export function m(name) {
    if (typeof name == 'string') {
        return $(document.createElement(name));
    }
    return name.view;
}
function newComponent(name, id) {
    return {
        id: '#' + id,
        raw_id: id,
        view: m(name).attr('id', id),
        elem: () => $('#' + id)
    };
}
/**
 * 函数名 cc 意思是 create a component, 用来创建一个简单的组件。
 */
export function cc(name, options) {
    let id = `r${Math.round(Math.random() * 100000000)}`;
    // 如果没有 options
    if (!options) {
        return newComponent(name, id);
    }
    // 后面就可以默认有 options
    if (options.id)
        id = options.id;
    const component = newComponent(name, id);
    if (options.attr)
        component.view.attr(options.attr);
    if (options.classes)
        component.view.addClass(options.classes);
    if (options.children)
        component.view.append(options.children);
    return component;
}
export function span(text) {
    return m('span').text(text);
}
export function appendToList(list, items) {
    items.forEach(item => {
        var _a;
        list.elem().append(m(item));
        (_a = item.init) === null || _a === void 0 ? void 0 : _a.call(item);
    });
}
