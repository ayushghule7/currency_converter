document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "https://open.er-api.com/v6/latest/";

  const fromSelect = document.getElementById("from-select");
  const toSelect   = document.getElementById("to-select");
  const amountIn   = document.getElementById("amount");
  const resultDiv  = document.getElementById("result");
  const noteDiv    = document.getElementById("note");
  const flagFrom   = document.getElementById("flag-from");
  const flagTo     = document.getElementById("flag-to");
  const fromNameEl = document.getElementById("from-name");
  const toNameEl   = document.getElementById("to-name");
  const swapBtn    = document.getElementById("swap");
  const convertBtn = document.getElementById("convert");

  // Intl helper for country names (modern browsers)
  const regionNames = (typeof Intl !== "undefined" && Intl.DisplayNames)
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

  function getCountryName(countryCode) {
    if (!countryCode) return countryCode || "";
    if (countryCode === "FR") {
      // Many repos map EUR -> FR; make it clearer:
      return "European Union";
    }
    return regionNames ? regionNames.of(countryCode) : countryCode;
  }

  // Populate selects (sorted for nicer UX)
  const codes = Object.keys(countryList).sort();
  for (let code of codes) {
    const countryCode = countryList[code];
    const optionText = `${code} — ${getCountryName(countryCode)}`;

    const opt1 = document.createElement("option");
    opt1.value = code;
    opt1.text  = optionText;
    fromSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = code;
    opt2.text  = optionText;
    toSelect.appendChild(opt2);
  }

  // Set defaults
  fromSelect.value = "USD";
  toSelect.value = "INR";

  // Update flags + shown country names
  function updateFlagAndName(selectEl, flagEl, nameEl) {
    const code = selectEl.value;
    const ccode = countryList[code] || "US";
    flagEl.src = `https://flagsapi.com/${ccode}/flat/64.png`;
    nameEl.textContent = getCountryName(ccode) + ` (${ccode})`;
  }

  // initial update
  updateFlagAndName(fromSelect, flagFrom, fromNameEl);
  updateFlagAndName(toSelect, flagTo, toNameEl);

  // listeners
  fromSelect.addEventListener("change", () => updateFlagAndName(fromSelect, flagFrom, fromNameEl));
  toSelect.addEventListener("change", () => updateFlagAndName(toSelect, flagTo, toNameEl));

  // swap functionality
  swapBtn.addEventListener("click", () => {
    const a = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = a;
    updateFlagAndName(fromSelect, flagFrom, fromNameEl);
    updateFlagAndName(toSelect, flagTo, toNameEl);
  });

  // conversion
  async function convert() {
    const amt = parseFloat(amountIn.value);
    if (!amt || amt <= 0) {
      resultDiv.textContent = "Enter a valid amount (> 0).";
      return;
    }

    const from = fromSelect.value;
    const to   = toSelect.value;

    resultDiv.textContent = "Fetching rate…";
    noteDiv.textContent = "";

    try {
      const res = await fetch(`${BASE_URL}${from}`);
      const data = await res.json();

      if (!data || data.result !== "success" || !data.rates) {
        throw new Error("Rate fetch failed");
      }

      const rate = data.rates[to];
      if (rate === undefined) {
        throw new Error(`No rate for ${to}`);
      }

      const converted = (amt * rate).toFixed(4);
      resultDiv.textContent = `${amt} ${from} = ${converted} ${to} (rate: ${rate})`;
    } catch (err) {
      console.error(err);
      resultDiv.textContent = "Conversion failed. Trying fallback…";

      // fallback using exchangerate.host
      try {
        const fallback = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amt}`);
        const fdata = await fallback.json();
        if (fdata && fdata.result !== false && fdata.info) {
          resultDiv.textContent = `${amt} ${from} = ${fdata.result.toFixed(4)} ${to} (rate: ${fdata.info.rate})`;
          noteDiv.textContent = "Used fallback API (exchangerate.host).";
        } else {
          throw new Error("Fallback failed");
        }
      } catch (e2) {
        console.error(e2);
        resultDiv.textContent = "Both APIs failed. See console for details.";
      }
    }
  }

  // handle form submission & convert button
  document.getElementById("converter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    convert();
  });

  convertBtn.addEventListener("click", (e) => {
    // button inside form will trigger submit, but keep this safe
    e.preventDefault();
    convert();
  });
});
