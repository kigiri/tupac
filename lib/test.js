const store = {}
const w = (_, ...args) => (console.log(_, ...args), _)
const get = key => new Promise(r => setTimeout(() => r(w(key, 'ready!')), 50))
const req = key => store[key] || (store[key] = get(key))


// 
const simple = {
  a: [ 'b', 'c' ],
  b: [ 'c' ],
  c: [],
}

const crossed = {
  a: [ 'b', 'c' ],
  b: [ 'a' ],
  c: [ 'b' ],
}