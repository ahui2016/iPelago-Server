import { m, cc } from './mj.js';
// 获取地址栏的参数。
export function getUrlParam(param) {
    let queryString = new URLSearchParams(document.location.search);
    return queryString.get(param);
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
    if (options.responseType) {
        xhr.responseType = options.responseType;
    }
    else {
        xhr.responseType = 'json';
    }
    xhr.open(options.method, options.url);
    xhr.onerror = () => {
        const errMsg = 'An error occurred during the transaction';
        handleErr(errMsg);
    };
    xhr.addEventListener('load', function () {
        if (this.status == 200) {
            onSuccess(this.response);
        }
        else {
            let errMsg = `${this.status}`;
            if (this.responseType == 'text') {
                errMsg += ` ${this.responseText}`;
            }
            else {
                errMsg += ` ${this.response.message}`;
            }
            handleErr(errMsg);
        }
    });
    xhr.addEventListener('loadend', function () {
        if (options.buttonID)
            enable(options.buttonID);
        if (onAlways)
            onAlways(this);
    });
    xhr.send(options.body);
}
export function getLoginStatus() {
    return new Promise(resolve => {
        ajax({ method: 'GET', url: '/api/login-status' }, (isLoggedIn) => {
            resolve(isLoggedIn);
        });
    });
}
export function newFormData(name, value) {
    const fd = new FormData();
    fd.set(name, value);
    return fd;
}
