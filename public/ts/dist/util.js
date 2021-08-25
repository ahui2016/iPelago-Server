import { m, cc } from './mj.js';
// 每一页有多少条消息。注意：如果修改该数值，同时需要修改 database.go 中的 EveryPage
export const everyPage = 10; // 99
// 找出第一个链接
export const httpRegex = /https?:\/\/[^\s,()!]+/;
// 获取地址栏的参数。
export function getUrlParam(param) {
    var _a;
    const queryString = new URLSearchParams(document.location.search);
    return (_a = queryString.get(param)) !== null && _a !== void 0 ? _a : '';
}
export function disable(id) {
    const nodeName = $(id).prop('nodeName');
    if (nodeName == 'BUTTON' || nodeName == 'INPUT') {
        $(id).prop('disabled', true);
    }
    else {
        $(id).css('pointer-events', 'none');
    }
}
export function enable(id) {
    const nodeName = $(id).prop('nodeName');
    if (nodeName == 'BUTTON' || nodeName == 'INPUT') {
        $(id).prop('disabled', false);
    }
    else {
        $(id).css('pointer-events', 'auto');
    }
}
export function CreateAlerts() {
    const alerts = cc('div');
    alerts.insertElem = (elem) => {
        $(alerts.id).prepend(elem);
    };
    alerts.insert = (msgType, msg) => {
        const time = dayjs().format('HH:mm:ss');
        const time_and_msg = `${time} ${msg}`;
        if (msgType == 'danger') {
            console.log(time_and_msg);
        }
        const elem = m('div')
            .addClass(`alert alert-${msgType} alert-dismissible fade show mt-1 mb-0`)
            .attr({ role: 'alert' })
            .append([
            m('span').text(time_and_msg),
            m('button').attr({ type: 'button', class: "btn-close", 'data-bs-dismiss': "alert", 'aria-label': "Close" }),
        ]);
        alerts.insertElem(elem);
    };
    alerts.clear = () => {
        $(alerts.id).html('');
        return alerts;
    };
    return alerts;
}
export function CreateLoading() {
    const loading = cc('div', { classes: 'text-center', children: [
            m('div').addClass('spinner-border').attr({ role: 'status' }).append(m('span').addClass('visually-hidden').text('Loading...'))
        ] });
    loading.hide = () => { loading.elem().hide(); };
    loading.show = () => { loading.elem().show(); };
    return loading;
}
export function CreateInfoPair(name, messages) {
    const InfoMsg = cc('div', { id: 'abount' + name + 'msg', classes: 'card text-dark bg-light my-3', children: [
            m('div').text(name).addClass('card-header'),
            m('div').addClass('card-body text-secondary').append(m('div').addClass('card-text').append(messages)),
        ] });
    const infoBtn = m('button').addClass('btn btn-outline-dark').attr({ title: '显示/隐藏' + name }).append(m('i').addClass('bi bi-info-circle')).on('click', () => { InfoMsg.elem().toggle(); });
    return [infoBtn, m(InfoMsg)];
}
export function ajax(options, onSuccess, onFail, onAlways) {
    const handleErr = (errMsg) => {
        if (onFail) {
            onFail(errMsg);
            return;
        }
        if (options.alerts) {
            options.alerts.insert('danger', errMsg);
        }
        else {
            console.log(errMsg);
        }
    };
    if (options.buttonID)
        disable(options.buttonID);
    const xhr = new XMLHttpRequest();
    xhr.timeout = 10 * 1000;
    xhr.ontimeout = () => {
        handleErr('timeout');
    };
    if (options.responseType) {
        xhr.responseType = options.responseType;
    }
    else {
        xhr.responseType = 'json';
    }
    xhr.open(options.method, options.url);
    xhr.onerror = () => {
        handleErr('An error occurred during the transaction');
    };
    xhr.onload = function () {
        var _a;
        if (this.status == 200) {
            onSuccess(this.response);
        }
        else {
            let errMsg = `${this.status}`;
            if (this.responseType == 'text') {
                errMsg += ` ${this.responseText}`;
            }
            else {
                errMsg += ` ${(_a = this.response) === null || _a === void 0 ? void 0 : _a.message}`;
            }
            handleErr(errMsg);
        }
    };
    xhr.onloadend = function () {
        if (options.buttonID)
            enable(options.buttonID);
        if (onAlways)
            onAlways(this);
    };
    if (options.body && !(options.body instanceof FormData)) {
        const body = new FormData();
        for (const [k, v] of Object.entries(options.body)) {
            body.set(k, v);
        }
        xhr.send(body);
    }
    else {
        xhr.send(options.body);
    }
}
/**
 * @param n 超时限制，单位是秒
 */
export function ajaxPromise(options, n) {
    const second = 1000;
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { reject('timeout'); }, n * second);
        ajax(options, result => { resolve(result); }, // onSuccess
        // onSuccess
        errMsg => { reject(errMsg); }, // onError
        () => { clearTimeout(timeout); } // onAlways
        );
    });
}
function getLoginStatus(alerts) {
    return new Promise(resolve => {
        ajax({ method: 'GET', url: '/api/login-status', alerts: alerts }, (isLoggedIn) => {
            resolve(isLoggedIn);
        });
    });
}
export function newFormData(name, value) {
    const fd = new FormData();
    fd.set(name, value);
    return fd;
}
export async function checkLogin(alerts) {
    const isLoggedIn = await getLoginStatus(alerts);
    if (isLoggedIn) {
        $('.onLoggedIn').show();
        $('.onLoggedOut').hide();
    }
    else {
        alerts === null || alerts === void 0 ? void 0 : alerts.insert('info', '需要用管理员密码登入后才能访问本页面');
        $('.onLoggedIn').hide();
        $('.onLoggedOut').show();
    }
    return isLoggedIn;
}
export const LoginArea = cc('div', { classes: 'text-center', children: [
        m('a').text('Login').attr({ href: '/public/login.html' }),
    ] });
export function val(obj) {
    if ('elem' in obj)
        return obj.elem().val();
    return obj.val();
}
export function itemID(id) {
    return `i${id}`;
}
