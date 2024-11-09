import { ElectionSystem } from "../../lib/election"
const votingSystem = new ElectionSystem(); 
let voters = new Map(); 
let tally = new Map();

export async function POST(request){ 
    const data = await request.json(); 
    const voterID = data.id; 
    const vote = data.vote;
    const privateKey = ModularMath.randomInRange(votingSystem.q);
    const voterKeyPair = { 
        privateKey: privateKey,
        publicKey: ModularMath.modPow(votingSystem.q, privateKey, votingSystem.p)
    };
    voters.set(voterID, voterKeyPair);
    votingSystem.registerVoter(voterID, voterKeyPair.publicKey);

    const ballot = votingSystem.vote(voterID, vote, voterKeyPair.privateKey);

    const partialDecryptions = [];
    for (let i = 1n; i <= 4n; i++) {
        const pd = votingSystem.createPartialDecryption(i, votingSystem.shares.shares.get(i), ballot);
        partialDecryptions.push(pd);
    }

    // Tally votes
    const results = votingSystem.tallyVotes(partialDecryptions);
    let votes = tally.get(data.vote); 
    votes += 1;
    return Response.json(tally);
}