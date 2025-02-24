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
    }
  }

  function auto() {
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
   * @param {number} i
   * @param {string} esp ['influence', 'sabotage', 'incite']
   */
  function autoCBtn(root, i, esp) {
    const id = `gov-${i}_${esp}`
    /** @type {HTMLButtonElement} */
    let auto = root.querySelector(`#${id}`);
    if (!auto) {
      auto = root.appendChild(document.createElement("span"));
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
  await fetch(`/saves/${name}`, {
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

