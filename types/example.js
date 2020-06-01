const { Id, test, Left, Right, fromNullable, tryCatch, Fn } = require("./index")

const nextCharForNumberString = str => {
  const trimmed = str.trim()
  const number = parseInt(trimmed)
  const nextNumber = number + 1
  return String.fromCharCode(nextNumber)
}

const _nextCharForNumberString = str =>
  Id.of(str)
    .map(s => s.trim())
    .map(parseInt)
    .map(n => n + 1)
    .fold(String.fromCharCode)

test("nextCharForNumberString")(
  nextCharForNumberString,
  _nextCharForNumberString
)("A")("    64  ")

const first = xs => xs[0]

const halfTheFirstLargeNumber = xs => {
  const found = xs.filter(x => x >= 20)
  const answer = first(found) / 2
  return `The answer is ${answer}`
}

const _halfTheFirstLargeNumber = xs =>
  Id.of(xs)
    .map(xs => xs.filter(x => x >= 20))
    .map(n => first(n) / 2)
    .fold(answer => `The answer is ${answer}`)

test("halfTheFirstLargeNumber")(
  halfTheFirstLargeNumber,
  _halfTheFirstLargeNumber
)("The answer is 25")([1, 4, 50])

const moneyToFloat = str => parseFloat(str.replace(/\$/, ""))
const _moneyToFloat = str =>
  Id.of(str)
    .map(s => s.replace(/\$/, ""))
    .fold(parseFloat)

test("moneyToFloat")(moneyToFloat, _moneyToFloat)("5")("$5.00")

const percentToFloat = str =>
  Id.of(str)
    .map(s => s.replace(/%/, ""))
    .map(parseFloat)
    .fold(f => f * 0.01)

const applyDiscount = (price, discount) => {
  const cents = moneyToFloat(price)
  const savings = percentToFloat(discount)
  return cents - cents * savings
}
// const _applyDiscount = (price, discount) =>
//   Id.of(price)
//     .map(moneyToFloat)
//     .fold(cents => cents - (cents * percentToFloat(discount)))
const _applyDiscount = (price, discount) =>
  Id.of(price)
    .map(moneyToFloat)
    .chain(cents =>
      Id.of(discount)
        .map(percentToFloat)
        .map(savings => cents - cents * savings)
    )
    .fold(x => x)

test("applyDiscount")(applyDiscount, _applyDiscount)("4")("$5.00", "20%")

const findColor = name =>
  ({
    red: "#f44",
    blue: "#46A",
    yellow: "#ff9",
  }[name])
// eslint-disable-next-line
const throws = () => findColor("not existant").toUpperCase()
// TypeError: Cannot read property 'toUpperCase' of undefined

const _findColor = name => {
  const found = {
    red: "#f44",
    blue: "#46A",
    yellow: "#ff9",
  }[name]
  return found ? Right(found) : Left("missing")
}
const res = str =>
  _findColor(str)
    .map(x => x.toUpperCase())
    .map(x => x.slice(1))
    .fold(
      () => "no color",
      color => color
    )
const _findColorFromNullable = name =>
  fromNullable(
    {
      red: "#f44",
      blue: "#46A",
      yellow: "#ff9",
    }[name]
  )

const resFromNullable = str =>
  _findColorFromNullable(str)
    .map(x => x.toUpperCase())
    .map(x => x.slice(1))
    .fold(
      () => "no color",
      color => color
    )
test("findColor works as expected")(res, () => "F44")("F44")("red")
test("findColor shouldn't break")(res, () => "no color")("no color")(
  "not existant"
)
test("findColorFromNullable works as expected")(res, resFromNullable)("F44")(
  "red"
)
test("findColorFromNullable works when no colors")(res, resFromNullable)(
  "no color"
)("not existant")

const getVersion = (file = "package.json") => {
  const fs = require("fs")
  try {
    const str = fs.readFileSync(file)
    const config = JSON.parse(str)
    return config.version
  } catch (e) {
    return "no version specified"
  }
}
const readFileSync = path => {
  const fs = require("fs")
  return tryCatch(() => fs.readFileSync(path))
}

const parseJSON = contents => tryCatch(() => JSON.parse(contents))

const _getVersion = (file = "package.json") =>
  readFileSync(file)
    .chain(contents => parseJSON(contents))
    .map(config => config.version)
    .fold(
      () => "no version specified",
      x => x
    )

// "version": "1.0.0",
test("getVersion works")(getVersion, () => "1.0.0")("1.0.0")("package.json")
// test(msg: any)(f: fn, j: fn)(result)(...args)
test("getVersion fails gracefully from an error")(
  getVersion,
  () => "no version specified"
)("no version specified")("fake.json")
test("_getVersion works")(_getVersion, () => "1.0.0")("1.0.0")("package.json")
test("_getVersion fails gracefully from an error")(
  _getVersion,
  () => "no version specified"
)("no version specified")("fake.json")

const street = user => {
  if (user && user.address && user.address.street) {
    return user.address.street
  } else {
    return "no street"
  }
}
const _street = user =>
  fromNullable(user.address)
    .chain(address => fromNullable(address.street))
    .fold(
      () => "no street",
      x => x
    )

test("street works")(street, _street)("5th Ave")({
  address: { street: "5th Ave" },
})
test("street fails gracefully 1")(street, _street)("no street")({
  address: {},
})
test("street fails gracefully 2")(street, _street)("no street")({})

const DB_REGEX = /postgres:\/\/([^:]+):([^@]+)@.*?\/(.+)$/i
const parseDBUrl = cfg => {
  try {
    const c = JSON.parse(cfg)
    return c.url.match(DB_REGEX)
  } catch (e) {
    return null
  }
}
const _parseDBUrl = cfg =>
  parseJSON(cfg)
    .chain(c => fromNullable(c.url))
    .chain(url => fromNullable(url.match(DB_REGEX)))
    .fold(
      () => null,
      x => x
    )
test("parseDBUrl works")(parseDBUrl, _parseDBUrl)(
  "postgres://sally:muppets@localhost:5432/mybd,sally,muppets,mybd"
)('{"url":"postgres://sally:muppets@localhost:5432/mybd"}')
test("parseDBUrl fails gracefully")(parseDBUrl, _parseDBUrl)("null")(
  '{"no_url":"postgres://otheruser:muppets@localhost:5432/mybd"}'
)

const startApp = cfg => {
  const parsed = parseDBUrl(cfg)
  if (parsed) {
    const [_, user, password, db] = parsed
    return `starting ${db}, ${user}, ${password}`
  } else {
    return "can't get config"
  }
}

const toUpperCase = x => x.toUpperCase()
const exclamation = x => x.concat("!")
const emphatize = x => Fn(toUpperCase).map(exclamation).run(x)
const doubleEmphatize = x =>
  Fn(toUpperCase)
    .concat(Fn(exclamation))
    .map(x => x.slice(2))
    .run(x)

test("Fn works")(emphatize, () => "HOLA!")("HOLA!")("hola")
test("Fn doubleEmphatize works")(doubleEmphatize, () => "LAhola!")("LAhola!")(
  "this tests will fail"
)

