const crypto = require('crypto');

class ModularMath { 

    static modPow(a, b, n) {
        a = BigInt(a);
        b = BigInt(b);
        n = BigInt(n);
        let result = 1n;
        a = a % n;
        while (b > 0n) {
        if (b & 1n) result = (result * a) % n;
        a = (a * a) % n;
        b = b >> 1n;
        }
        return result;
    }

    static modInverse(a, m){
        let [old_r, r] = [BigInt(a), BigInt(m)];
        let [old_s, s] = [BigInt(1), BigInt(0)];
        
        while (r !== BigInt(0)) {
            const quotient = old_r / r;
            [old_r, r] = [r, old_r - quotient * r];
            [old_s, s] = [s, old_s - quotient * s];
        }
        
        return (old_s + m) % m;
    }

    static randomInRange(n) {
        n = BigInt(n);
        let bytes = Math.ceil(n.toString(2).length / 8);
        let result;
        do {
          result = BigInt('0x' + crypto.randomBytes(bytes).toString('hex'));
        } while (result >= n || result === 0n);
        return result;
      }

    static lagrangeInterpolate(shares, indices, p) {
        let result = 0n;
        for (let i = 0; i < shares.length; i++) {
          let term = shares[i];
          for (let j = 0; j < indices.length; j++) {
            if (i !== j) {
              const num = indices[j];
              const denom = (indices[j] - indices[i]);
              term = (term * num * ModularMath.modInverse(denom, p)) % p;
            }
          }
          result = (result + term) % p;
        }
        return result;
      }

      static hash(...args) {
        const hash = crypto.createHash('sha256');
        args.forEach(arg => hash.update(arg.toString()));
        return BigInt('0x' + hash.digest('hex'));
      }
}

class ThresholdSystem { 
    constructor(n, t, p, q, g) {
        this.n = n; // Total number of authorities
        this.t = t; // Threshold (t+1 authorities needed)
        this.p = p; // Prime modulus
        this.q = q; // Prime order subgroup
        this.g = g; // Generator
        
        this.shares = new Map(); // Shares for each authority
        this.publicShares = new Map(); // Public verification values
        this.publicKey = null; // Joint public key
      }
    
    generateShares() {
    // Generate random polynomial coefficients
        const coefficients = Array(this.t)
            .fill(0)
            .map(() => ModularMath.randomInRange(this.q));
        
        // Generate shares for each authority
        for (let i = 1n; i <= this.n; i++) {
            let share = coefficients[0];
            for (let j = 1; j < coefficients.length; j++) {
            share = (share + coefficients[j] * ModularMath.modPow(i, BigInt(j), this.q)) % this.q;
            }
            this.shares.set(i, share);
            
            // Generate verification values
            const verificationValue = ModularMath.modPow(this.g, share, this.p);
            this.publicShares.set(i, verificationValue);
        }

        // Compute joint public key
        this.publicKey = ModularMath.modPow(
            this.g,
            coefficients[0], // Secret is coefficient[0]
            this.p
        );

        return {
            shares: this.shares,
            publicShares: this.publicShares,
            publicKey: this.publicKey
        };
    }

    // Verify share from other authority
    verifyShare(authorityId, share) {
        const verificationValue = ModularMath.modPow(this.g, share, this.p);
        return verificationValue === this.publicShares.get(authorityId);
    }

}

class ElectionSystem { 

    constructor(){ 
        this.p = crypto.generatePrimeSync(64, {bigint: true});
        this.q = (this.p-1n)/2n;
        this.g = 2n; 

        this.threshold = new ThresholdSystem(5n, 3n, this.p, this.q, this.g);
        this.shares = this.threshold.generateShares();

        this.voters = new Map(); 
        this.votes = new Map();
        this.partialDecryptions = new Map();
    }

    registerVoter(voterId, publicKey) {
        if (this.voters.has(voterId)) {
          throw new Error('Voter already registered');
        }
        this.voters.set(voterId, {
          publicKey,
          hasVoted: false
        });
    }

    vote(voterId, vote, voterPrivateKey){ 
        if (!this.voters.has(voterId) || this.voters.get(voterId).hasVoted) {
            throw new Error('Invalid voter or already voted');
          }
      
          // Create encrypted vote using joint public key
          const r = ModularMath.randomInRange(this.threshold.q);
          const a = ModularMath.modPow(this.threshold.g, r, this.threshold.p);
          const b = (ModularMath.modPow(this.threshold.publicKey, r, this.threshold.p) * 
                     ModularMath.modPow(this.threshold.g, vote, this.threshold.p)) % this.threshold.p;
      
          // Create zero-knowledge proof of validity
          const proof = this.createVoteProof(vote, r, voterPrivateKey);
      
          const ballot = { a, b, proof };
          this.votes.set(voterId, ballot);
          this.voters.get(voterId).hasVoted = true;
      
          return ballot;
    }

    createVoteProof(vote, r, privateKey) {
        // Random values for proof
        const w = ModularMath.randomInRange(this.threshold.q);
        const d = ModularMath.randomInRange(this.threshold.q);
        const t = ModularMath.randomInRange(this.threshold.q);
    
        // Commitment values
        const a1 = ModularMath.modPow(this.threshold.g, w, this.threshold.p);
        const b1 = vote === 1n ? 
          ModularMath.modPow(this.threshold.g, t, this.threshold.p) :
          ModularMath.modPow(this.threshold.g, d, this.threshold.p);
    
        // Challenge
        const c = ModularMath.hash(a1, b1);
        
        // Response values
        const r1 = (w - r * c) % this.threshold.q;
        const r2 = vote === 1n ?
          (t - privateKey * c) % this.threshold.q :
          (d - privateKey * (c - r1)) % this.threshold.q;
    
        return { a1, b1, r1, r2, c };
    }

    createPartialDecryption(authorityId, share, ballot) {
        const { a } = ballot;
        const partialDecryption = ModularMath.modPow(a, share, this.threshold.p);
        
        // Create proof of correct partial decryption
        const w = ModularMath.randomInRange(this.threshold.q);
        const t = ModularMath.modPow(this.threshold.g, w, this.threshold.p);
        const c = ModularMath.hash(a, partialDecryption, t);
        const r = (w - share * c) % this.threshold.q;
    
        return {
          authorityId,
          partialDecryption,
          proof: { t, c, r }
        };
    }

    combinePartialDecryptions(ballot, partialDecryptions) {
        if (partialDecryptions.length <= this.threshold.t) {
          throw new Error('Not enough partial decryptions');
        }
    
        const { a, b } = ballot;
        const indices = partialDecryptions.map(pd => pd.authorityId);
        const shares = partialDecryptions.map(pd => pd.partialDecryption);
    
        // Combine shares using Lagrange interpolation
        const m = ModularMath.lagrangeInterpolate(
          shares,
          indices,
          this.threshold.p
        );
    
        // Recover vote
        const vote = (b * ModularMath.modInverse(m, this.threshold.p)) % this.threshold.p;
        
        // Check if vote is 0 or 1
        if (vote === ModularMath.modPow(this.threshold.g, 0n, this.threshold.p)) {
          return 0n;
        } else if (vote === ModularMath.modPow(this.threshold.g, 1n, this.threshold.p)) {
          return 1n;
        } else {
          throw new Error('Invalid vote value');
        }
    }

    verifyPartialDecryption(partialDecryption, publicShare, ballot) {
        const { t, c, r } = partialDecryption.proof;
        const verificationValue = (ModularMath.modPow(this.threshold.g, r, this.threshold.p) *
          ModularMath.modPow(publicShare, c, this.threshold.p)) % this.threshold.p;
        
        return verificationValue === t;
    }

    tallyVotes(authorityDecryptions) {
        let yes = 0n;
        let no = 0n;
    
        for (const [voterId, ballot] of this.votes) {
          try {
            const vote = this.combinePartialDecryptions(ballot, authorityDecryptions);
            if (vote === 1n) yes += 1n;
            else no += 1n;
          } catch (error) {
            console.error(`Failed to decrypt vote for ${voterId}: ${error.message}`);
          }
        }
    
        return { yes: Number(yes), no: Number(no), total: Number(yes + no) };
    }

}



const votingSystem = new ElectionSystem(); 
const privateKey = ModularMath.randomInRange(votingSystem.q)
const voterKeyPair = { 
    privateKey: privateKey,
    publicKey: ModularMath.modPow(votingSystem.q, privateKey, votingSystem.p)
};

votingSystem.registerVoter("voter1", voterKeyPair.publicKey);

const ballot = votingSystem.vote("voter1", -1n, voterKeyPair.privateKey);

const partialDecryptions = [];
for (let i = 1n; i <= 4n; i++) {
  const pd = votingSystem.createPartialDecryption(i, votingSystem.shares.shares.get(i), ballot);
  partialDecryptions.push(pd);
}

// Tally votes
const results = votingSystem.tallyVotes(partialDecryptions);
console.log(results);