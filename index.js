const sha1 = require('sha1')
const _ = require('underscore')

const TEST_BIT_SIZES = [6, 8, 10, 12, 14, 16, 18, 20]
const TRIALS_PER_BIT_SIZE = 50
const MAX_STRING_LENGTH = 2

console.log("[info] Script Initialized")

console.log("[info] Defining functions and methods")

const create_binary_digest = (text) => {
  const digest = sha1(text)
  return _.range(digest.length / 2).map((index) => { // process byte-size hex
    const short_binary = parseInt(digest.substring(index * 2, index * 2 + 2), 16).toString(2)
    return "00000000".substring(short_binary.length) + short_binary
  }).join('')
}

const create_truncated_digest = (text, bit_size) => {
  return parseInt(create_binary_digest(text).slice(0, bit_size), 2)
}

const shuffle = (array) => {
  // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  var array_copy = array
  var currentIndex = array_copy.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array_copy[currentIndex];
    array_copy[currentIndex] = array_copy[randomIndex];
    array_copy[randomIndex] = temporaryValue;
  }
  return array_copy;
}

const all_strings = _.range(parseInt(new Array(MAX_STRING_LENGTH).fill('ff').join(''), 16)).map((num) => {
  output = num.toString(16)
  return (output.length % 2 != 0 ? "0" : "") + output
})

const collision_attack = (bit_size, set_index = 0) => {
  const digests = new Array(shuffled_strings[set_index].size)
  var used_digests = 0
  try {
    shuffled_strings[set_index].forEach((rstring1, index1) => {
      digests[index1] = create_truncated_digest(rstring1, bit_size)
      used_digests += 1
      _.range(index1 - 1).forEach((index2) => {
        if (digests[index1] == digests[index2]) {
          throw 'collision found' // I hate doing this to leave a loop.
        }
      })
    })
  } catch (e) {
    return {usedDigests: used_digests, found: true}
  }
  return {usedDigests: used_digests, found: false}
}

const preimage_attack = (bit_size, set_index = 0) => {
  const preimage = _.sample(shuffled_strings[set_index])
  const digest = create_truncated_digest(preimage, bit_size)
  var found = false
  var used_digests = 0
  try {
    shuffled_strings[set_index].forEach((rstring) => {
      used_digests += 1
      if (create_truncated_digest(rstring, bit_size) == digest) {
        throw 'pre-image found' // I hate doing this to leave a loop.
      }
    })
  } catch (e) {
    return {usedDigests: used_digests, found: true}
  }
  return {usedDigests: used_digests, found: false}
}

const run_attacks = (attack_func, name) => {
  return _.object(TEST_BIT_SIZES.map((bit_size) => {
    //console.log(`[debug] Testing ${name} attack for bitsize ${bit_size}.`)
    const trial_results = _.range(TRIALS_PER_BIT_SIZE).map((test_num) => {
      const trial_result = attack_func(bit_size, test_num)
      if (trial_result.found){
        return trial_result.usedDigests
      } else {
        //console.log(`[debug] Error occured. ${name} not found on trial ${test_num}.`)
        throw `${name} not encountered`
      }
    })
    const output = trial_results.reduce((a, b) => a + b) / trial_results.length
    //console.log(`[debug] Attack finished after ${output} attempts`)
    return [bit_size, output]
  }))
}

const build_output_string = (data) => '( ' +
  _.pairs(data).map(([key, value]) => `(${key}, ${value})`).join(', ') + ' )'

console.log("[info] Finished defining functions and methods")

console.log("[info] Calculating preimage combinations")
const shuffled_strings = new Array(TRIALS_PER_BIT_SIZE).fill(shuffle(all_strings))
console.log("[info] Finished calculating combinations")

console.log('[info] Running collision tests')
const collision_data = run_attacks(collision_attack, 'collision')
console.log('[info] Results of collision tests (bit size, attempts): ' + build_output_string(collision_data))

console.log('[info] Running preimage tests')
const preimage_data = run_attacks(preimage_attack, 'pre-image')
console.log('[info] Results of preimage tests (bit size, attempts): ' + build_output_string(preimage_data))

console.log('[info] Script finished successfully')
