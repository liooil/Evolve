import { govCivics } from './civics.js';
import { actions, runAction, checkTechQualifications } from './actions.js';

// Evolve Helper
export function evoHelper() {
  let autoIds = getStrSet("autoIds") ?? new Set();

  let scanTimer = setInterval(scan, getInt("scanInterval") ?? 1000);
  let autoTimer = setInterval(auto, getInt("autoInterval") ?? 100);
  let saveTimer = setInterval(save, getInt("saveInterval") ?? 10 * 60 * 1000);

  function scan() {
    const versionLogEl = document.getElementById("versionLog");
    if (versionLogEl) {
      menuBtn(versionLogEl, "scanInterval", "int", 1000, (val) => {
        clearInterval(scanTimer);
        scanTimer = setInterval(scan, val);
      });
      menuBtn(versionLogEl, "autoInterval", "int", 100, (val) => {
        clearInterval(autoTimer);
        autoTimer = setInterval(scan, val);
      });
      menuBtn(versionLogEl, "saveInterval", "int", 10 * 60 * 1000, (val) => {
        clearInterval(saveTimer);
        saveTimer = setInterval(save, val);
      });
      menuBtn(versionLogEl, "speed", "int", 16);
      menuBtn(versionLogEl, "name", "str", "", () => void 0, async () => {
        const res = await fetch(`/saves`);
        if (res.ok) {
          /** @type {{ name: string, count: number }[]} */
          const data = await res.json();
          return data.map((v) => `${v.name} has ${v.count} saves`);
        } else {
          return [];
        }
      });
      menuBtn(versionLogEl, "autoRun", "bool", true, (val) => {
        if (val) {
          autoTimer = setInterval(auto, getInt("autoInterval") ?? 100);
          scanTimer = setInterval(scan, getInt("scanInterval") ?? 1000);
        } else {
          clearInterval(autoTimer);
          clearInterval(scanTimer);
          autoTimer = undefined;
          scanTimer = undefined;
        }
      });
      menuBtn(versionLogEl, "autoAll", "bool", false);
      menuBtn(versionLogEl, "clearAll", "bool", false, (val) => {
        if (val) {
          autoIds.clear();
          setStrSet('autoIds', autoIds);
        }
      });
      menuBtn(versionLogEl, "autoHidden", "bool", false);
    }
    for (const node of document.querySelectorAll("div.action.vb")) {
      if (node.id.startsWith("tech-")) continue;
      if (node.id.startsWith("genes-")) continue;
      autoBtn(node, node.firstChild);
    }
    for (const node of document.querySelectorAll("div.resource.crafted")) {
      if (node.style.display === "none") continue;
      autoBtn(node, node.firstChild);
    }
    for (const node of document.getElementById("market")?.querySelectorAll("div.market-item") ?? []) {
      if (node.style.display === "none") continue;
      for (const type of ['buy', 'sell']) {
        const span = node.querySelector('span.' + type);
        if (!span) continue;
        autoBtn(span, span, node.id + '-' + type);
      }
    }
    for (const gov of [0, 1, 2]) {
      const id = `gov${gov}`;
      const el = document.getElementById(id);
      if (!el) continue;
      for (const esp of ['influence', 'sabotage', 'incite']) {
        autoCBtn(el, gov, esp);
      }
    }
  }

  function auto() {
    if (!getBool("autoRun")) return;
    if (getBool("autoAll")) {
      for (const node of document.querySelectorAll("div.action.vb")) {
        if (node.classList.contains("cna")) continue;
        const a = node.querySelector("a.button");
        if (a) a.click();
      }
    }
    for (const id of autoIds) {
      for (const type of ['buy', 'sell']) {
        if (id.endsWith('-' + type)) {
          const el = document.getElementById(id.slice(0, -type.length - 1));
          if (!el) continue;
          const prev = el.querySelector('span.' + type);
          if (!prev) continue;
          prev.nextElementSibling.click();
        }
      }
      if (id.startsWith('gov-')) {
        const f = id.slice('gov-'.length);
        if (f.startsWith("s_")) continue;
        const [istr, esp] = f.split("_");
        const i = parseInt(istr);
        govCivics('t_spy', i);
        govCivics('s_' + esp, i);
        continue;
      }
      const [action, type] = id.split('-');
      if (action && type) {
        const c_action = actions[action][type];
        if (localStorage.getItem("autoHidden") && c_action) {
          if (checkTechQualifications(c_action, type)) {
            runAction(c_action, action, type);
          }
          continue;
        }
      }
      const el = document.getElementById(id);
      if (!el || el.classList.contains("cna")) continue;
      /** @type {HTMLElement} */
      const a = el.querySelector("a.button,a:has(span[data-val='A'])");
      a?.click();
    }
  }

  /**
   * @param {HTMLElement} nextElementSibling
   * @param {string} id
   * @param {"int" | "str" | "bool"} type
   * @param {number} defaultVal
   * @param {((val: number) => void)=} cb
   * @param {(() => Promise<string[]>)=} getPromptMessage
   */
  function menuBtn(nextElementSibling, id, type, defaultVal, cb, getPromptMessage) {
    if (document.getElementById(id)) return;
    const getVal = () => {
      if (type === "bool") return getBool(id) ?? defaultVal;
      else if (type === "str") return localStorage.getItem(id) ?? defaultVal;
      else return getInt(id) ?? defaultVal;
    };
    const el = document.createElement("span");
    el.id = id;
    el.classList.add("version");
    el.style.cursor = "pointer";
    el.textContent = `${id}=${getVal()}`;
    el.onclick = async () => {
      let val;
      if (type === "bool") {
        val = !(getVal());
        setBool(id, val);
      } else if (type === "str") {
        let msg = getPromptMessage ? await getPromptMessage() : [];
        msg.push(`${id}=`);
        let input = prompt(msg.join('\n'), `${getVal()}`);
        if (input === null) return;
        val = input;
        localStorage.setItem(id, input);
      } else {
        let msg = getPromptMessage ? await getPromptMessage() : [];
        msg.push(`${id}=`);
        let input = prompt(msg.join('\n'), `${getVal()}`);
        if (input === null) return;
        val = parseInt(input)
        setInt(id, input);
      }
      el.textContent = `${id}=${val}`;
      cb?.(val);
    }
    nextElementSibling.before(el);
    return el;
  }

  /**
   * add auto button
   * @param {HTMLElement} root
   * @param {HTMLElement?} parent
   */
  function autoBtn(root, parent = root, id = root.id) {
    /** @type {HTMLButtonElement} */
    let auto = root.querySelector(".auto");
    if (!auto) {
      auto = parent.appendChild(document.createElement("span"));
      auto.classList.add("auto");
      auto.textContent = "A";
      auto.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (autoIds.has(id)) {
          autoIds.delete(id);
          auto.style.color = "gray";
        } else {
          autoIds.add(id);
          auto.style.color = "green";
        }
        setStrSet("autoIds", autoIds);
      }
    }
    if (autoIds.has(id)) {
      auto.style.color = "green";
    } else {
      auto.style.color = "gray";
    }
  }
  /**
   * add auto button
   * @param {HTMLElement} root
   * @param {number} id
   * @param {string} esp ['influence', 'sabotage', 'incite']
   */
  function autoCBtn(root, id, esp) {
    const id = `gov-${id}_${esp}`
    /** @type {HTMLButtonElement} */
    let auto = root.querySelector(`#${id}`);
    if (!auto) {
      auto = parent.appendChild(document.createElement("span"));
      auto.id = id;
      auto.classList.add("auto");
      auto.textContent = esp;
      auto.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (autoIds.has(id)) {
          autoIds.delete(id);
          auto.style.color = "gray";
        } else {
          autoIds.add(id);
          auto.style.color = "green";
        }
        setStrSet("autoIds", autoIds);
      }
    }
    if (autoIds.has(id)) {
      auto.style.color = "green";
    } else {
      auto.style.color = "gray";
    }
  }
}

async function save() {
  const name = localStorage.getItem('name');
  if (!name) return;
  const res = await fetch(`/saves/${name}`, {
    method: 'POST',
    body: JSON.stringify({
      data: window.exportGame(),
      autoIds: localStorage.getItem('autoIds'),
    }),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  });
}

/**
  * @param {string} key
  * @param {number} defaultVal
  */
function useInt(key, defaultVal) {
  let text = localStorage.getItem(key);
  let val = text ? parseInt(text) : defaultVal;
  return [
    () => val,
    /** @type {(val: number) => void} */
    (v) => {
      val = v;
      localStorage.setItem(key, v.toString());
    }
  ];
}

/**
  * @param {string} key
  */
function getInt(key) {
  const val = localStorage.getItem(key);
  if (val !== null) return parseFloat(val);
}
/**
  * @param {string} key
  * @param {number} val
  */
function setInt(key, val) {
  localStorage.setItem(key, val)
}
/**
  * @param {string} key
  */
function getStrSet(key) {
  const val = localStorage.getItem(key);
  if (val !== null) return new Set(val.split(","));
}
/**
  * @param {string} key
  * @param {Set<string>} val
  */
function setStrSet(key, val) {
  localStorage.setItem(key, [...val.keys()].join(","))
}
/**
  * @param {string} key
  */
function getBool(key) {
  const val = localStorage.getItem(key);
  if (val !== null) return val === "true";
}
/**
  * @param {string} key
  * @param {boolean} val
  */
function setBool(key, val) {
  localStorage.setItem(key, val.toString());
}

