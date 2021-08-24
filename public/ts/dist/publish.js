import { m, cc, span } from './mj.js';
import * as util from './util.js';
let islandID = util.getUrlParam('id');
const jsonFile = `/public/${islandID}.json`;
const islandMsgPage = `/public/island-messages.html?id=${islandID}`;
const Alerts = util.CreateAlerts();
const Loading = util.CreateLoading();
const Title = cc('div', { classes: 'display-6' });
const TitleArea = cc('div', {
    classes: 'd-flex justify-content-between align-items-center my-5',
    children: [
        m(Title).text('Publish'),
        m('a').attr({ href: '/public/dashboard.html', title: 'dashboard' }).addClass('btn btn-outline-dark').append(m('i').addClass('bi bi-gear')),
    ]
});
const HowToPublish = cc('div', { children: [
        m('div').text('可任意选择以下其中一种方法发布至 iPelago 网络供他人订阅：'),
        m('ol').append([
            m('li').append([
                span('把小岛地址 '), span(location.origin + jsonFile).addClass('bg-light'),
                span(' 提交至 '), m('a').text('ipelago.org').attr({ href: 'https://ipelago.org', target: '_blank' }), span(' 即可。'),
            ]),
            m('li').append([
                span('利用第三方免费平台，参考教程: '),
                m('a').text('https://ipelago.org/public/how-to-publish.html').attr({ href: 'https://ipelago.org/public/how-to-publish.html', target: '_blank' }),
            ]),
        ]),
    ] });
const CopyBtn = cc('button', { id: 'copy', classes: 'btn btn-outline-primary' });
const DownloadBtn = cc('a', { classes: 'btn btn-outline-primary ms-2' });
const ButtonsArea = cc('div', { children: [
        m(CopyBtn).text('Copy'),
        m(DownloadBtn).text('Download')
            .attr({ download: 'newsletter.json', href: jsonFile }),
        m('a').text('Edit').attr({ href: islandMsgPage }).addClass('btn btn-outline-secondary ms-2'),
    ] });
const Newsletter = cc('textarea', { classes: 'form-control' });
$('#root').append([
    m(TitleArea),
    m(HowToPublish).addClass('onLoggedIn'),
    m(Loading).hide(),
    m(Alerts).addClass('my-3'),
    m(ButtonsArea).hide(),
    m(Newsletter).addClass('mt-3 mb-5').hide(),
    m(util.LoginArea).addClass('onLoggedOut my-5'),
]);
init();
async function init() {
    const isLoggedIn = await util.checkLogin(Alerts);
    if (!isLoggedIn)
        return;
    Loading.show();
    util.ajax({ method: 'GET', url: jsonFile, alerts: Alerts, responseType: 'text' }, (newsletter) => {
        $(ButtonsArea.id).show();
        $(Newsletter.id).show().val(newsletter)
            .css('height', $(Newsletter.id).prop('scrollHeight'))
            .prop({ disabled: true });
    }, errMsg => {
        if (errMsg.toLowerCase().includes('not found')) {
            HowToPublish.elem().hide();
        }
        Alerts.insert('danger', 'Not Found');
    }, () => {
        $(Loading.id).hide();
    });
}
const clipboard = new ClipboardJS(CopyBtn.id, {
    text: () => { return util.val(Newsletter); }
});
clipboard.on('success', () => {
    CopyBtn.elem().text('copied').removeClass('btn-outline-primary').addClass('btn-outline-secondary');
});
clipboard.on('error', e => {
    console.error('Action:', e.action);
    console.error('Trigger:', e.trigger);
    Alerts.insert('danger', '复制失败，详细信息见控制台');
});
