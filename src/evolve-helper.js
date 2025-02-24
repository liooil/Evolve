// Evolve Helper
export function evoHelper() {
  let scanTimer = setInterval(scan, getInt("scanInterval") ?? 1000);
  let saveTimer = setInterval(save, getInt("saveInterval") ?? 10 * 60 * 1000);

  function scan() {
    const versionLogEl = document.getElementById("versionLog");
    if (versionLogEl) {
      menuBtn(versionLogEl, "scanInterval", "int", 1000, (val) => {
        clearInterval(scanTimer);
        scanTimer = setInterval(scan, val);
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

