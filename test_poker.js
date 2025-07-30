import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Poker hand evaluation functions
function evaluateHand(cards) {
  const values = cards.map(card => card.value).sort((a, b) => a - b);
  const suits = cards.map(card => card.suit);
  
  const isFlush = suits.every(suit => suit === suits[0]);
  const isStraight = values.every((val, i) => i === 0 || val === values[i-1] + 1);
  
  const valueCounts = {};
  values.forEach(val => valueCounts[val] = (valueCounts[val] || 0) + 1);
  const counts = Object.values(valueCounts).sort((a, b) => b - a);
  
  if (isStraight && isFlush) return { rank: 8, name: 'Straight Flush' };
  if (counts[0] === 4) return { rank: 7, name: 'Four of a Kind' };
  if (counts[0] === 3 && counts[1] === 2) return { rank: 6, name: 'Full House' };
  if (isFlush) return { rank: 5, name: 'Flush' };
  if (isStraight) return { rank: 4, name: 'Straight' };
  if (counts[0] === 3) return { rank: 3, name: 'Three of a Kind' };
  if (counts[0] === 2 && counts[1] === 2) return { rank: 2, name: 'Two Pair' };
  if (counts[0] === 2) return { rank: 1, name: 'Pair' };
  return { rank: 0, name: 'High Card' };
}

function createCard(value, suit) {
  return { value, suit };
}

async function testPoker() {
  try {
    console.log('🎰 Testing Poker Hand Evaluation...\n');

    let testsPassed = 0;
    let totalTests = 0;

    // Test 1: High Card
    console.log('1. Testing High Card...');
    totalTests++;
    const highCard = [
      createCard(2, 'hearts'),
      createCard(5, 'diamonds'),
      createCard(7, 'clubs'),
      createCard(9, 'spades'),
      createCard(11, 'hearts')
    ];
    const highCardResult = evaluateHand(highCard);
    if (highCardResult.rank === 0 && highCardResult.name === 'High Card') {
      console.log('✅ High Card test passed');
      testsPassed++;
    } else {
      console.log('❌ High Card test failed');
    }

    // Test 2: Pair
    console.log('\n2. Testing Pair...');
    totalTests++;
    const pair = [
      createCard(2, 'hearts'),
      createCard(2, 'diamonds'),
      createCard(7, 'clubs'),
      createCard(9, 'spades'),
      createCard(11, 'hearts')
    ];
    const pairResult = evaluateHand(pair);
    if (pairResult.rank === 1 && pairResult.name === 'Pair') {
      console.log('✅ Pair test passed');
      testsPassed++;
    } else {
      console.log('❌ Pair test failed');
    }

    // Test 3: Two Pair
    console.log('\n3. Testing Two Pair...');
    totalTests++;
    const twoPair = [
      createCard(2, 'hearts'),
      createCard(2, 'diamonds'),
      createCard(7, 'clubs'),
      createCard(7, 'spades'),
      createCard(11, 'hearts')
    ];
    const twoPairResult = evaluateHand(twoPair);
    if (twoPairResult.rank === 2 && twoPairResult.name === 'Two Pair') {
      console.log('✅ Two Pair test passed');
      testsPassed++;
    } else {
      console.log('❌ Two Pair test failed');
    }

    // Test 4: Three of a Kind
    console.log('\n4. Testing Three of a Kind...');
    totalTests++;
    const threeOfKind = [
      createCard(7, 'hearts'),
      createCard(7, 'diamonds'),
      createCard(7, 'clubs'),
      createCard(9, 'spades'),
      createCard(11, 'hearts')
    ];
    const threeOfKindResult = evaluateHand(threeOfKind);
    if (threeOfKindResult.rank === 3 && threeOfKindResult.name === 'Three of a Kind') {
      console.log('✅ Three of a Kind test passed');
      testsPassed++;
    } else {
      console.log('❌ Three of a Kind test failed');
    }

    // Test 5: Straight
    console.log('\n5. Testing Straight...');
    totalTests++;
    const straight = [
      createCard(5, 'hearts'),
      createCard(6, 'diamonds'),
      createCard(7, 'clubs'),
      createCard(8, 'spades'),
      createCard(9, 'hearts')
    ];
    const straightResult = evaluateHand(straight);
    if (straightResult.rank === 4 && straightResult.name === 'Straight') {
      console.log('✅ Straight test passed');
      testsPassed++;
    } else {
      console.log('❌ Straight test failed');
    }

    // Test 6: Flush
    console.log('\n6. Testing Flush...');
    totalTests++;
    const flush = [
      createCard(2, 'hearts'),
      createCard(5, 'hearts'),
      createCard(7, 'hearts'),
      createCard(9, 'hearts'),
      createCard(11, 'hearts')
    ];
    const flushResult = evaluateHand(flush);
    if (flushResult.rank === 5 && flushResult.name === 'Flush') {
      console.log('✅ Flush test passed');
      testsPassed++;
    } else {
      console.log('❌ Flush test failed');
    }

    // Test 7: Full House
    console.log('\n7. Testing Full House...');
    totalTests++;
    const fullHouse = [
      createCard(7, 'hearts'),
      createCard(7, 'diamonds'),
      createCard(7, 'clubs'),
      createCard(9, 'spades'),
      createCard(9, 'hearts')
    ];
    const fullHouseResult = evaluateHand(fullHouse);
    if (fullHouseResult.rank === 6 && fullHouseResult.name === 'Full House') {
      console.log('✅ Full House test passed');
      testsPassed++;
    } else {
      console.log('❌ Full House test failed');
    }

    // Test 8: Four of a Kind
    console.log('\n8. Testing Four of a Kind...');
    totalTests++;
    const fourOfKind = [
      createCard(7, 'hearts'),
      createCard(7, 'diamonds'),
      createCard(7, 'clubs'),
      createCard(7, 'spades'),
      createCard(9, 'hearts')
    ];
    const fourOfKindResult = evaluateHand(fourOfKind);
    if (fourOfKindResult.rank === 7 && fourOfKindResult.name === 'Four of a Kind') {
      console.log('✅ Four of a Kind test passed');
      testsPassed++;
    } else {
      console.log('❌ Four of a Kind test failed');
    }

    // Test 9: Straight Flush
    console.log('\n9. Testing Straight Flush...');
    totalTests++;
    const straightFlush = [
      createCard(5, 'hearts'),
      createCard(6, 'hearts'),
      createCard(7, 'hearts'),
      createCard(8, 'hearts'),
      createCard(9, 'hearts')
    ];
    const straightFlushResult = evaluateHand(straightFlush);
    if (straightFlushResult.rank === 8 && straightFlushResult.name === 'Straight Flush') {
      console.log('✅ Straight Flush test passed');
      testsPassed++;
    } else {
      console.log('❌ Straight Flush test failed');
    }

    // Summary
    console.log('\n🎯 Test Summary:');
    console.log(`   Tests passed: ${testsPassed}/${totalTests}`);
    if (testsPassed === totalTests) {
      console.log('✅ All poker hand evaluation tests passed!');
    } else {
      console.log('❌ Some tests failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPoker();