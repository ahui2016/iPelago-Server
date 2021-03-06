import { m, cc, span, appendToListAsync } from './mj.js';
import * as util from './util.js';
const allIslands = new Map();
let lastTime = dayjs().unix();
let firstTime = true;
let scope = util.getUrlParam('scope');
const Alerts = util.CreateAlerts();
const Loading = util.CreateLoading();
const allMsgUrl = '/public/index.html?scope=all';
const [infoBtn, infoMsg] = util.CreateInfoPair('使用说明', m('ul').append([
    m('li').append([
        span('在已登入的状态下访问 '),
        m('a').text(allMsgUrl).attr({ href: allMsgUrl }),
        span(' 可包含隐藏岛的消息。'),
    ]),
    m('li').text('按 F12 打开控制台，输入命令 update_title("新的大标题") 可更改大标题。'),
    m('li').text('输入命令 update_subtitle("新的副标题") 可更改副标题。'),
    m('li').append([
        span('也可以进入 '),
        m('a').text('Config页面').attr({ href: '/public/config.html' }),
        span(' 修改标题。'),
    ]),
]));
const Title = cc('span');
const Subtitle = cc('div', { classes: 'fs-2 text-muted mt-3' });
const titleArea = m('div').addClass('my-5 text-center').append([
    m('div').addClass('display-4').append([
        m(Title).text('Timeline'),
        infoBtn.addClass('onLoggedIn ms-1 btn-sm').hide(),
        m('a').attr({ href: '/public/dashboard.html', title: 'dashboard' }).addClass('btn btn-sm btn-outline-dark ms-1').append(m('i').addClass('bi bi-gear')),
    ]),
    m(Subtitle),
]);
const MsgList = cc('div', { classes: 'my-5 vstack gap-5' });
const MoreBtn = cc('button', { classes: 'btn btn-outline-secondary' });
const MoreBtnArea = cc('div', { classes: 'text-center my-5', children: [
        m(MoreBtn).text('More').on('click', getPublicMessages),
    ] });
const BottomLine = cc('div', { classes: 'text-center fw-light small text-secondary mb-3', children: [
        m('a').text('https://github.com/ahui2016/iPelago-Server').addClass('link-secondary')
            .attr({ href: 'https://github.com/ahui2016/iPelago-Server', target: '_blank' }),
        m('i').addClass('bi bi-box-arrow-up-right ms-1'),
    ] });
$('#root').append([
    titleArea,
    infoMsg.hide(),
    m(MsgList),
    m(Alerts).addClass('my-5'),
    m(Loading).addClass('my-5'),
    m(MoreBtnArea),
    m(BottomLine).hide(),
]);
init();
async function init() {
    const isLoggedIn = await util.checkLogin(); // 这里不能加 Alerts, 否则会提示需要管理员密码。
    if (!isLoggedIn)
        scope = '';
    initTitle();
    getPublicMessages();
}
function initTitle() {
    util.ajax({ method: 'GET', url: '/api/get-titles', alerts: Alerts }, (resp) => {
        const titles = resp;
        Title.elem().text(titles.Title);
        Subtitle.elem().text(titles.Subtitle);
    });
}
function getPublicMessages() {
    Loading.show();
    if (firstTime) {
        var infoMsg = '没有公开消息';
        firstTime = false;
    }
    else {
        var infoMsg = '没有更多消息了';
    }
    if (scope == 'all') {
        var url = '/admin/more-all-messages';
    }
    else {
        var url = '/api/more-public-messages';
    }
    const body = util.newFormData('time', lastTime.toString());
    util.ajax({ method: 'POST', url: url, alerts: Alerts, body: body }, async (resp) => {
        const messages = resp;
        if (!messages || messages.length == 0) {
            Alerts.insert('primary', infoMsg);
            MoreBtnArea.elem().hide();
            return;
        }
        if (messages.length < util.everyPage) {
            MoreBtnArea.elem().hide();
        }
        else {
            BottomLine.elem().show();
        }
        await appendToListAsync(MsgList, messages.map(MsgItem));
        lastTime = messages[messages.length - 1].Time;
    }, undefined, () => {
        Loading.hide();
    });
}
function MsgItem(msg) {
    const MsgAlerts = util.CreateAlerts();
    const datetime = dayjs.unix(msg.Time).format('YYYY-MM-DD HH:mm:ss');
    const islandPage = '/public/island-messages.html?id=' + msg.IslandID;
    const self = cc('div', { id: util.itemID(msg.ID), classes: 'd-flex justify-content-start align-items-start MsgItem', children: [
            m('a').attr({ href: islandPage }).append(m('img').addClass('Avatar').attr({ src: '/public/avatar-default.jpg' })),
            m('div').addClass('ms-3 flex-fill').append([
                m('div').addClass('Name'),
                m('div').addClass('Contents fs-5').attr({ title: datetime }),
                m(MsgAlerts),
            ]),
        ] });
    self.init = async () => {
        const island = await getIsland(msg.IslandID, MsgAlerts);
        if (!island)
            return;
        if (island.Avatar) {
            self.elem().find('.Avatar').attr({ src: island.Avatar });
        }
        const NameElem = self.elem().find('.Name');
        NameElem.append(m('a').text(island.Name).attr({ href: islandPage }).addClass('text-decoration-none link-dark fw-bold'));
        if (island.Email) {
            NameElem.append(m('span').text(island.Email).addClass('small text-muted ms-1'));
        }
        const contentsElem = $(self.id).find('.Contents');
        const contents = util.contentsWithLinks(msg.Body);
        if (typeof contents == 'string') {
            contentsElem.text(contents);
        }
        else {
            contentsElem.append(contents);
        }
    };
    return self;
}
async function getIsland(id, alerts) {
    try {
        let island = allIslands.get(id);
        if (island)
            return island;
        island = await getIslandByID(id);
        allIslands.set(id, island);
        return island;
    }
    catch (err) {
        alerts.insert('danger', err);
    }
}
function getIslandByID(id) {
    if (scope == 'all') {
        var url = '/admin/get-island';
    }
    else {
        var url = '/api/get-island';
    }
    const body = util.newFormData('id', id);
    return new Promise((resolve, reject) => {
        util.ajax({ method: 'POST', url: url, body: body }, (island) => {
            resolve(island);
        }, (errMsg) => {
            reject(errMsg);
        });
    });
}
window.update_title = (title) => {
    const body = util.newFormData('title', title.trim());
    util.ajax({ method: 'POST', url: '/admin/update-title', alerts: Alerts, body: body }, () => {
        Title.elem().text(title);
        const infoMsg = '标题更新成功';
        Alerts.insert('success', infoMsg);
        console.log(infoMsg);
    });
};
window.update_subtitle = (subtitle) => {
    const body = util.newFormData('subtitle', subtitle.trim());
    util.ajax({ method: 'POST', url: '/admin/update-subtitle', alerts: Alerts, body: body }, () => {
        Subtitle.elem().text(subtitle);
        const infoMsg = '副标题更新成功';
        Alerts.insert('success', infoMsg);
        console.log(infoMsg);
    });
};
