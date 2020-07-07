const successFn = (counter, msg) => console.log(`${counter}. ${msg} ✅`)
const errorFn = (testCounter, msg, result1, result2, res) => {
  console.log(`${testCounter}. ${msg} ❌`)
  console.log(`  ❌ Got: ${result1} === ${result2}`)
  console.log(`     -> Expected ${res}`)
}
let testCounter = 0
const test = msg => (f, j) => res => (...args) => {
  const result1 = f(...args)
  const result2 = j(...args)
  testCounter++
  const success =
    String(result1) === String(res) && String(result2) === String(res)
  success
    ? successFn(testCounter, msg)
    : errorFn(testCounter, msg, result1, result2, res)
}

// Identity monad
const Id = x => ({
  x,
  map: f => Id(f(x)),
  fold: f => f(x),
  chain: f => f(x),
  concat: o => Id(x.concat(o.x)),
  toString: () => `Id(${x})`,
})
Id.of = x => Id(x)

const Left = x => ({
  x,
  map: _ => Left(x),
  fold: f => f(x),
  chain: _ => Left(x),
  concat: o => Left(x.concat(o.x)),
  toString: () => `Left(${x})`,
})
Left.of = x => Left(x)

const Right = x => ({
  x,
  map: f => Right(f(x)),
  fold: (_, g) => g(x),
  chain: f => f(x),
  concat: o => Right(x.concat(o.x)),
  toString: () => `Right(${x})`,
})
Right.of = x => Right(x)

const Either = x => ({
  x,
  map: f => Either(f(x)),
  fold: f => f(x),
  chain: f => f(x),
  concat: o => Either(x.concat(o.x)),
  toString: () => `Either(${x})`,
})
Either.of = x => Either(x)

const fromNullable = (x, err) => (x != null ? Right(x) : Left(err))

const tryCatch = f => {
  try {
    return Right(f())
  } catch (e) {
    return Left(e)
  }
}

// ---- Function modelling

// Functors: they can only map
const Fn = run => ({
  run,
  chain: f => Fn(x => f(run(x)).run(x)),
  map: f => Fn(x => f(run(x))),
  concat: other => Fn(x => run(x).concat(other.run(x))),
})
Fn.ask = Fn(x => x)
Fn.of = x => Fn(() => x)

// ---- Contravariant functors
// They have the ability to contramap

const Endo = run => ({
  // Called after endomorphism
  // Only works with types a -> a
  // Will compose as its concatenation behaviour
  // It is not a functor because using map we could change it's type
  //    therefore, it doesn't have the `map` method
  run,
  concat: other => Endo(x => run(other.run(x))),
  contramap: fn => Endo(x => run(fn(x))),
})
Endo.of = x => Endo(x)
Endo.empty = () => Endo(x => x)

// Types equivalences
// (acc, x) -> acc
// (x, acc) -> acc
// x -> acc -> acc
// x -> Endo(acc -> acc)
// Fn(x -> Endo(acc -> acc))
const Reducer = run => ({
  // (acc, x) -> acc
  run,
  concat: other => Reducer((acc, x) => other.run(run(acc, x), x)),
  contramap: f => Reducer((acc, x) => run(acc, f(x))),
})
Reducer.empty = () => Reducer(() => {})

const Pred = run => ({
  run,
  concat: other => Pred(x => run(x) && other.run(x)),
  contramap: fn => Pred(x => run(fn(x))),
})
Pred.of = run => Pred(run)

// ---- Profunctors
// They can contramap and map, and therefore can change the
//    'input' and the 'output' as a connector functors

// ---- Exports
const types = {
  Endo,
  Fn,
  Id,
  Left,
  Right,
  fromNullable,
  test,
  tryCatch,
  Reducer,
  Pred,
}

module.exports = types
