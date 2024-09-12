import * as SecureStore from "expo-secure-store";

const ByteSizeLimit = 2000;
export default function createSecureStorage(options = {}) {
  const replaceCharacter = options.replaceCharacter || "_";
  const replacer = options.replacer || defaultReplacer;

  return {
    getItem: key => {
      return new Promise(async (resolve, reject) => {
        let index = 0;
        let string = "";
        while (true) {
          const response = await SecureStore.getItemAsync(
            `${replacer(key, replaceCharacter)}-${index}`
          )
          if (response === null) {
            break;
          }
          string += response;
          index += 1;
        }
        if (string.length === 0) {
          resolve(null);
        } else {
          resolve(string);
        }
      })
    },

    setItem: (key, value) => {
      return new Promise(async (resolve, reject) => {
        const sizedArr = getStringSizedInBytes(value);
        for (let index = 0; index < sizedArr.length; index++) {
          const endIndex = sizedArr[index] + 1;
          const startIndex = index === 0 ? 0 : sizedArr[index - 1] + 1;
          await SecureStore.setItemAsync(
            `${replacer(key, replaceCharacter)}-${index}`,
            value.slice(startIndex, endIndex)
          )
        }
        resolve();
      })
    },

    removeItem: key =>
      SecureStore.deleteItemAsync(replacer(key, replaceCharacter))
  }
}
function getStringSizedInBytes(str) {
  let sizeInBytes = 0;
  const sizeBreakPoints = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    sizeInBytes += code <= 0xffff ? 2 : 4;
    if (Number.isInteger(sizeInBytes / ByteSizeLimit)) {
      sizeBreakPoints.push(i);
    }
  }
  const lastIndex = str.length - 1;
  if (sizeBreakPoints[sizeBreakPoints.length - 1] !== lastIndex) {
    sizeBreakPoints.push(str.length - 1);
  }
  return sizeBreakPoints;
}

function defaultReplacer(key, replaceCharacter) {
  return key.replace(/[^a-z0-9.\-_]/gi, replaceCharacter);
}
