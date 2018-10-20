;
(function () {
    const formBox = document.getElementById('otpFormBox');
    const defaultAccountInfoForm = formBox.firstElementChild;
    let browserContainers = [];

    browser.contextualIdentities.onCreated.addListener((changeInfo) => {
        browserContainers.push({
            cookieStoreId: changeInfo.contextualIdentity.cookieStoreId,
            name: changeInfo.contextualIdentity.name,
        });
        updateFormBoxContainers(formBox, browserContainers);
    });
    browser.contextualIdentities.onRemoved.addListener((changeInfo) => {
        browserContainers = browserContainers
            .filter(
                container => container.cookieStoreId !== changeInfo.contextualIdentity.cookieStoreId
            );
        updateFormBoxContainers(formBox, browserContainers);
    });
    browser.contextualIdentities.onUpdated.addListener((changeInfo) => {
        let needUpdate = false;
        browserContainers = browserContainers.map((container) => {
            const { contextualIdentity } = changeInfo
            if (contextualIdentity.cookieStoreId === container.cookieStoreId &&
                contextualIdentity.name !== container.name) {
                container = {
                    ...container,
                    name: contextualIdentity.name
                };
                needUpdate = true;
            }
            return container;
        });
        if (needUpdate) {
            updateFormBoxContainers(formBox, browserContainers);
        }
    });
    function updateFormBoxContainers(formBox, containers) {
        const { children } = formBox;
        const { length } = children;
        for (let i = 0; i < length; i++) {
            updateInfoForm(children[i], { containers });
        }
        // update default accoutnInfo form's contaienr
        updateInfoForm(defaultAccountInfoForm, {
            containers,
        });
    }
    function updateInfoForm(form, {
        info,
        containers
    }) {
        if (containers) {
            const select = form.querySelector('[name=containerAssign]');
            const { value } = select;
            const options = generateSelectOptionList(
                containers.map(container => ({
                    value: container.cookieStoreId,
                    text: container.name
                }))
            );
            htmlBrandNewChildren(select, options);
            // remove select's option leading select.value = ''
            select.value = value;
        }
        if (info) {
            Object.keys(info).forEach((key) => {
                const element = form.querySelector(`[name=${key}]`);
                if (element) {
                    element.value = info[key];
                }
            });
        }
    }
    function generateSelectOptionList(data) {
        return data.map((item) => {
            const option = document.createElement('option');
            option.value = item.value;
            option.textContent = item.text;
            return option;
        })
    }
    function removeChildren(node, direction = 'fromFirst', count = Infinity) {
        const { children } = node;
        let i = 0;
        while (children.length > 0 && i < count) {
            if (direction === 'fromFirst') {
                node.firstElementChild.remove();
            } else {
                node.lastElementChild.remove();
            }
            i++;
        }
    }
    function htmlBrandNewChildren(node, children) {
        removeChildren(node);
        if (Array.isArray(children)) {
            node.append(...children);
        } else {
            node.append(children);
        }
    }
    function getBrowserContainers() {
        return browserContainers;
    }
    async function initBrowserContainers() {
        const result = await browser.contextualIdentities.query({});
        browserContainers = [{
            cookieStoreId: '',
            name: 'none'
        }].concat(
            result
                .map((identities) => ({
                    cookieStoreId: identities.cookieStoreId,
                    name: identities.name
                }))
        );
    }


    window.browserContainers = browserContainers;
    window.htmlBrandNewChildren = htmlBrandNewChildren;
    window.removeChildren = removeChildren;
    window.getBrowserContainers = getBrowserContainers;
    window.htmlBrandNewChildren = htmlBrandNewChildren;
    window.removeChildren = removeChildren;
    window.updateInfoForm = updateInfoForm;
    window.initBrowserContainers = initBrowserContainers;
    window.getBrowserContainers = getBrowserContainers;
})();
