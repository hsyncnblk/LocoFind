import type { Platform, LocatorStrategy } from '../types';

export interface CodeSnippets {
  python: string;
  java: string;
  javascript: string;
}

export function generateCodeSnippets(
  platform: Platform,
  strategy: LocatorStrategy,
  value: string,
  resolvedXPath: string
): CodeSnippets {
  if (platform === 'ios') {
    return generateIOSSnippets(strategy, value, resolvedXPath);
  }
  if (platform === 'android') {
    return generateAndroidSnippets(strategy, value, resolvedXPath);
  }
  return generateWebSnippets(strategy, value, resolvedXPath);
}

function generateIOSSnippets(
  strategy: LocatorStrategy,
  value: string,
  resolvedXPath: string
): CodeSnippets {
  switch (strategy) {
    case 'xpath':
      return {
        python: `element = driver.find_element(AppiumBy.XPATH, "${value}")`,
        java: `WebElement element = driver.findElement(AppiumBy.XPATH, "${value}");`,
        javascript: `const element = await driver.$(\"${value}\");`,
      };
    case 'accessibility-id':
      return {
        python: `element = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "${value}")`,
        java: `WebElement element = driver.findElement(AppiumBy.ACCESSIBILITY_ID, "${value}");`,
        javascript: `const element = await driver.$("~${value}");`,
      };
    case 'predicate-string':
      return {
        python: `element = driver.find_element(AppiumBy.IOS_PREDICATE, "${value}")`,
        java: `WebElement element = driver.findElement(MobileBy.iOSNsPredicateString("${value}"));`,
        javascript: `const element = await driver.$("-ios predicate string:${value}");`,
      };
    case 'class-chain':
      return {
        python: `element = driver.find_element(AppiumBy.IOS_CLASS_CHAIN, "${value}")`,
        java: `WebElement element = driver.findElement(MobileBy.iOSClassChain("${value}"));`,
        javascript: `const element = await driver.$("-ios class chain:${value}");`,
      };
    default:
      return {
        python: `element = driver.find_element(AppiumBy.XPATH, "${resolvedXPath}")`,
        java: `WebElement element = driver.findElement(AppiumBy.XPATH, "${resolvedXPath}");`,
        javascript: `const element = await driver.$("${resolvedXPath}");`,
      };
  }
}

function generateAndroidSnippets(
  strategy: LocatorStrategy,
  value: string,
  resolvedXPath: string
): CodeSnippets {
  switch (strategy) {
    case 'xpath':
      return {
        python: `element = driver.find_element(AppiumBy.XPATH, "${value}")`,
        java: `WebElement element = driver.findElement(AppiumBy.XPATH, "${value}");`,
        javascript: `const element = await driver.$(\"${value}\");`,
      };
    case 'resource-id':
      return {
        python: `element = driver.find_element(AppiumBy.ID, "${value}")`,
        java: `WebElement element = driver.findElement(AppiumBy.ID, "${value}");`,
        javascript: `const element = await driver.$("id=${value}");`,
      };
    case 'accessibility-id':
      return {
        python: `element = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "${value}")`,
        java: `WebElement element = driver.findElement(AppiumBy.ACCESSIBILITY_ID, "${value}");`,
        javascript: `const element = await driver.$("~${value}");`,
      };
    case 'text':
      return {
        python: `element = driver.find_element(AppiumBy.XPATH, "${resolvedXPath}")`,
        java: `WebElement element = driver.findElement(AppiumBy.XPATH, "${resolvedXPath}");`,
        javascript: `const element = await driver.$(\"${resolvedXPath}\");`,
      };
    default:
      return {
        python: `element = driver.find_element(AppiumBy.XPATH, "${resolvedXPath}")`,
        java: `WebElement element = driver.findElement(AppiumBy.XPATH, "${resolvedXPath}");`,
        javascript: `const element = await driver.$("${resolvedXPath}");`,
      };
  }
}

function generateWebSnippets(
  strategy: LocatorStrategy,
  value: string,
  resolvedXPath: string
): CodeSnippets {
  switch (strategy) {
    case 'xpath':
      return {
        python: `element = driver.find_element(By.XPATH, "${value}")`,
        java: `WebElement element = driver.findElement(By.XPATH, "${value}");`,
        javascript: `const element = await driver.$(\"${value}\");`,
      };
    case 'css-selector':
      return {
        python: `element = driver.find_element(By.CSS_SELECTOR, "${value}")`,
        java: `WebElement element = driver.findElement(By.CSS_SELECTOR, "${value}");`,
        javascript: `const element = await driver.$("${value}");`,
      };
    case 'id':
      return {
        python: `element = driver.find_element(By.ID, "${value}")`,
        java: `WebElement element = driver.findElement(By.ID, "${value}");`,
        javascript: `const element = document.getElementById("${value}");`,
      };
    case 'name':
      return {
        python: `element = driver.find_element(By.NAME, "${value}")`,
        java: `WebElement element = driver.findElement(By.NAME, "${value}");`,
        javascript: `const element = document.querySelector("[name='${value}']");`,
      };
    case 'class-name':
      return {
        python: `element = driver.find_element(By.CLASS_NAME, "${value}")`,
        java: `WebElement element = driver.findElement(By.CLASS_NAME, "${value}");`,
        javascript: `const element = document.querySelector(".${value}");`,
      };
    default:
      return {
        python: `element = driver.find_element(By.XPATH, "${resolvedXPath}")`,
        java: `WebElement element = driver.findElement(By.XPATH, "${resolvedXPath}");`,
        javascript: `const element = await driver.$("${resolvedXPath}");`,
      };
  }
}
