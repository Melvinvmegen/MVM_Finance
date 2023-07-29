const rules = {
  required: (v) => !!v && v.length !== 0,
  requiredIf: (v, condition) => {
    return !!v || condition;
  },
  maxLength: (v, max) => !v || v.length <= max,
  minLength: (v, min) => !v || v.length >= min,
  min: (v, min) => v >= min || !v,
  isUrl: (v) => !v || /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/.test(v),
  nonNegative: (v) => !v || parseFloat(("" + v).replace(".", ",")) >= 0,
  number: (v) => !v || !Number.isNaN(Number(v)),
  passwordMatch: (v, confirm) => v === confirm,
  nonDecimal: (v) => !v || !(v % 1),
  zipCode: (v, country) => !v || country != "FR" || /^[0-9]{5}/.test(v.replace(/\s/g, "")),
  isEmail: (v) => !v || /^[a-zA-Z0-9+_-]+(?:\.[a-zA-Z0-9+_-]+)*@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(v),
  isValidUrl: (v) => {
    try {
      return !v || Boolean(new URL(v));
    } catch (e) {
      return !v || false;
    }
  },
  isHexColor: (v) => !v || /^#?[0-9a-f]{3}([0-9a-f]{3}([0-9a-f]{2})?)?$/i.test(v),
};

function rulify(rules, i18n) {
  const $t = i18n.global.t;
  return Object.fromEntries(
    Object.entries(rules).map(([key, validator]) => {
      return [
        key,
        function (...args) {
          return function (value) {
            let valid = false;
            try {
              valid = validator.apply(this, [value, ...args]);
            } catch (err) {
              // if value is empty and rule not handling this case, return true
              if (!value) return true;
            }
            return (
              valid || $t(`errors.validator.${key}`, args.length === 1 && typeof args[0] === "object" ? args[0] : args)
            );
          };
        },
      ];
    }),
  );
}

let $v;
export const useValidation = () => $v;
export function createValidator(i18n) {
  return {
    install(app) {
      $v = rulify(rules, i18n);
      app.config.globalProperties.$v = $v;
    },
  };
}
