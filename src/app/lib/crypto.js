// const crypto = require('crypto');
// // Implementation of Shamir's Secret Sharing system

// // class SecretSharing { 


// // }

// // Implementation of ElGamal Cryptosystem

// class ElGamal {
//     constructor(p, g) {
//       this.p = p; // Prime modulus
//       this.g = g; // Generator
//     }
  
//     generateKeyPair() {
//       const privateKey = this.generatePrivateKey();
//       const publicKey = this.modPow(this.g, privateKey, this.p);
//       return { privateKey, publicKey };
//     }
  
//     generatePrivateKey() {
//       const bytes = new Uint8Array(32); // 256 bits
//       crypto.getRandomValues(bytes);
//       return this.bytesToBigInt(bytes) % (this.p - BigInt(1));
//     }
  
//     encrypt(message, publicKey) {
//       const r = this.generatePrivateKey(); // Random ephemeral key
//       const c1 = this.modPow(this.g, r, this.p);
//       const s = this.modPow(publicKey, r, this.p);
//       const c2 = (message * s) % this.p;
//       return { c1, c2 };
//     }
  
//     decrypt(ciphertext, privateKey) {
//       const { c1, c2 } = ciphertext;
//       const s = this.modPow(c1, privateKey, this.p);
//       const sInverse = this.modInverse(s, this.p);
//       return (c2 * sInverse) % this.p;
//     }
  
//     // Distributed key generation
//     generateDistributedKeys(n, t) {
//       const coefficients = Array(t).fill(0).map(() => this.generatePrivateKey());
//       const shares = [];
//       const verificationValues = coefficients.map(coef => 
//         this.modPow(this.g, coef, this.p)
//       );
  
//       // Generate shares for each authority
//       for (let i = 1; i <= n; i++) {
//         let share = coefficients[0];
//         let x = BigInt(i);
//         for (let j = 1; j < t; j++) {
//           share = (share + coefficients[j] * this.modPow(x, BigInt(j), this.p)) % (this.p - BigInt(1));
//         }
//         shares.push({
//           index: i,
//           value: share,
//           verificationValue: this.modPow(this.g, share, this.p)
//         });
//       }
  
//       return { shares, verificationValues };
//     }
  
//     // Combine partial decryptions
//     combinePartialDecryptions(partialDecryptions, threshold) {
//       if (partialDecryptions.length < threshold) {
//         throw new Error('Not enough partial decryptions');
//       }
  
//       let result = BigInt(1);
//       const indices = partialDecryptions.map(pd => pd.index);
  
//       for (let i = 0; i < threshold; i++) {
//         let numerator = BigInt(1);
//         let denominator = BigInt(1);
  
//         for (let j = 0; j < threshold; j++) {
//           if (i !== j) {
//             numerator = (numerator * -BigInt(indices[j])) % (this.p - BigInt(1));
//             denominator = (denominator * (BigInt(indices[i]) - BigInt(indices[j]))) % (this.p - BigInt(1));
//           }
//         }
  
//         const exponent = (numerator * this.modInverse(denominator, this.p - BigInt(1))) % (this.p - BigInt(1));
//         if (exponent < BigInt(0)) {
//           exponent += this.p - BigInt(1);
//         }
  
//         result = (result * this.modPow(partialDecryptions[i].value, exponent, this.p)) % this.p;
//       }
  
//       return result;
//     }
  
//     // Utility functions
//     modPow(base, exponent, modulus) {
//       if (modulus === BigInt(1)) return BigInt(0);
//       let result = BigInt(1);
//       base = base % modulus;
//       while (exponent > BigInt(0)) {
//         if (exponent % BigInt(2) === BigInt(1)) {
//           result = (result * base) % modulus;
//         }
//         exponent = exponent >> BigInt(1);
//         base = (base * base) % modulus;
//       }
//       return result;
//     }
  
//     modInverse(a, m) {
//       let [old_r, r] = [BigInt(a), BigInt(m)];
//       let [old_s, s] = [BigInt(1), BigInt(0)];
      
//       while (r !== BigInt(0)) {
//         const quotient = old_r / r;
//         [old_r, r] = [r, old_r - quotient * r];
//         [old_s, s] = [s, old_s - quotient * s];
//       }
      
//       return (old_s + m) % m;
//     }
  
//     bytesToBigInt(bytes) {
//       return BigInt('0x' + Array.from(bytes)
//         .map(b => b.toString(16).padStart(2, '0'))
//         .join(''));
//     }
//   }
  
//   // app/lib/ballot.js
// class Ballot {
// constructor(voterId, candidateId, elgamal) {
//     this.voterId = voterId;
//     this.candidateId = candidateId;
//     this.elgamal = elgamal;
//     this.timestamp = Date.now();
// }

// encrypt(publicKey) {
//     // Convert candidate choice to a number
//     const message = this.encodeCandidateChoice();
//     // Encrypt using ElGamal
//     const { c1, c2 } = this.elgamal.encrypt(message, publicKey);
    
//     this.encryptedVote = { c1, c2 };
//     return this.encryptedVote;
// }

// encodeCandidateChoice() {
//     // Simple encoding: use a unique prime number for each candidate
//     // In practice, you might want a more sophisticated encoding scheme
//     return BigInt(this.candidateId);
// }

// verify(publicKey) {
//     // Implement zero-knowledge proof verification here
//     return true;
// }
// }

// class Authority {
//     constructor(id, share, verificationValue, elgamal) {
//         this.id = id;
//         this.share = share;
//         this.verificationValue = verificationValue;
//         this.elgamal = elgamal;
//         this.partialDecryptions = new Map();
//     }
    
//     createPartialDecryption(ballot) {
//         const { c1 } = ballot.encryptedVote;
//         const partial = this.elgamal.modPow(c1, this.share, this.elgamal.p);
        
//         // Create zero-knowledge proof
//         const proof = this.createZKProof(c1, partial);
        
//         return {
//         index: this.id,
//         value: partial,
//         proof
//         };
//     }
    
//     createZKProof(c1, partial) {
//         // Implement Chaum-Pedersen ZK proof
//         const w = this.elgamal.generatePrivateKey();
//         const a1 = this.elgamal.modPow(this.elgamal.g, w, this.elgamal.p);
//         const a2 = this.elgamal.modPow(c1, w, this.elgamal.p);
        
//         // Challenge
//         const challenge = this.generateChallenge(c1, partial, a1, a2);
        
//         // Response
//         const response = (w + challenge * this.share) % (this.elgamal.p - BigInt(1));
        
//         return { a1, a2, response };
//     }
    
//     verifyPartialDecryption(partial, ballot) {
//         const { proof } = partial;
//         const challenge = this.generateChallenge(
//         ballot.encryptedVote.c1,
//         partial.value,
//         proof.a1,
//         proof.a2
//         );
    
//         // Verify the proof
//         const v1 = this.elgamal.modPow(this.elgamal.g, proof.response, this.elgamal.p);
//         const v2 = this.elgamal.modPow(ballot.encryptedVote.c1, proof.response, this.elgamal.p);
        
//         const expected1 = (proof.a1 * this.elgamal.modPow(this.verificationValue, challenge, this.elgamal.p)) % this.elgamal.p;
//         const expected2 = (proof.a2 * this.elgamal.modPow(partial.value, challenge, this.elgamal.p)) % this.elgamal.p;
        
//         return v1 === expected1 && v2 === expected2;
//     }
    
//     generateChallenge(...values) {
//         const concatenated = values.map(v => v.toString()).join(':');
//         const hash = crypto.createHash('sha256').update(concatenated).digest();
//         return BigInt('0x' + hash.toString('hex')) % (this.elgamal.p - BigInt(1));
//     }
// }

// class Election {
// constructor(candidates, voters, totalAuthorities, threshold) {
//     this.p = BigInt('115792089237316195423570985008687907853269984665640564039457584007908834671663');
//     this.g = BigInt(2);
    
//     this.elgamal = new ElGamal(this.p, this.g);
//     this.candidates = candidates;
//     this.voters = voters;
//     this.threshold = threshold;
//     this.totalAuthorities = totalAuthorities;
    
//     this.authorities = new Map();
//     this.ballots = new Map();
//     this.voterKeys = new Map();
// }

// initialize() {
//     // Generate distributed keys for authorities
//     const { shares, verificationValues } = this.elgamal.generateDistributedKeys(
//     this.totalAuthorities,
//     this.threshold
//     );

//     // Create authorities
//     shares.forEach((share, index) => {
//     const authority = new Authority(
//         share.index,
//         share.value,
//         share.verificationValue,
//         this.elgamal
//     );
//     this.authorities.set(share.index, authority);
//     });

//     // Calculate combined public key
//     this.publicKey = verificationValues.reduce(
//     (acc, val) => (acc * val) % this.p,
//     BigInt(1)
//     );

//     return {
//     publicKey: this.publicKey,
//     authorities: Array.from(this.authorities.values())
//     };
// }

// castVote(voterId, candidateId) {
//     if (!this.voters.includes(voterId)) {
//     throw new Error('Invalid voter');
//     }
//     if (this.ballots.has(voterId)) {
//     throw new Error('Voter has already cast a ballot');
//     }

//     // Create and encrypt ballot
//     const ballot = new Ballot(voterId, candidateId, this.elgamal);
//     ballot.encrypt(this.publicKey);

//     // Store ballot
//     this.ballots.set(voterId, ballot);
//     return ballot;
// }

// processVote(ballot) {
//     // Collect partial decryptions from authorities
//     const partialDecryptions = Array.from(this.authorities.values())
//     .map(authority => authority.createPartialDecryption(ballot));

//     // Verify all partial decryptions
//     const validDecryptions = partialDecryptions.filter(partial => {
//     const authority = this.authorities.get(partial.index);
//     return authority.verifyPartialDecryption(partial, ballot);
//     });

//     if (validDecryptions.length < this.threshold) {
//     throw new Error('Not enough valid partial decryptions');
//     }

//     // Combine partial decryptions
//     return this.elgamal.combinePartialDecryptions(
//     validDecryptions,
//     this.threshold
//     );
// }

// getTally() {
//     const tally = new Map();
//     this.candidates.forEach(candidate => tally.set(candidate, 0));

//     for (const ballot of this.ballots.values()) {
//     try {
//         const result = this.processVote(ballot);
//         const candidateId = Number(result.toString());
//         if (tally.has(candidateId)) {
//         tally.set(candidateId, tally.get(candidateId) + 1);
//         }
//     } catch (error) {
//         console.error(`Failed to process ballot: ${error.message}`);
//     }
//     }

//     return tally;
// }
// }



// const election = new Election([0, 1], [0,1,2,3,4,5,6,7,8], 5, 3);
// const { publicKey, authorities } = election.initialize(); 

// election.castVote(7, 0); 
// election.castVote(1, 1); 
// election.castVote(2, 1); 
// election.castVote(5, 1);
// election.castVote(6, 1);  
// election.castVote(3, 0);
// console.log(election.getTally());

