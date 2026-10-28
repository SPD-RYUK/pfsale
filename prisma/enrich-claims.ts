// enrich-claims.ts — Populate the 6 existing demo patents with FULL-LENGTH
// structured claims (10-14 claims each, with independent + dependent claims
// and proper "of claim N" references) and expanded descriptions.
//
// WHY THIS EXISTS:
// The original seed (prisma/seed.ts) populated the 6 demo patents with
// abbreviated 3-claim text (281-486 chars) — far too short for the
// ClaimStructure tree to be meaningful. Google Patents / USPTO are blocked
// from this sandbox (HTTP 503 anti-bot), so prisma/fetch-patents.ts cannot
// run end-to-end here. This script provides realistic, full-length, properly
// structured claims so the marketplace + ClaimStructure UI can be exercised
// end-to-end.
//
// PROVENANCE — HONEST MARKING:
// Each updated patent is tagged `dataSource: "demo-enriched"` so admins and
// buyers can see these are NOT fetched from a real patent office. To replace
// with REAL claims, run `npx tsx prisma/fetch-patents.ts` from an environment
// with Google Patents access, then `npx tsx prisma/seed-patents.ts`.
//
// Run: npx tsx prisma/enrich-claims.ts  (idempotent — safe to re-run)

import { db } from "../src/lib/db";

interface Enrichment {
  patentNumber: string;
  claims: string;
  description: string;
}

const ENRICHMENTS: Enrichment[] = [
  // ── US11234567B2 — Adaptive resource scheduling for edge-compute mesh ──
  {
    patentNumber: "US11234567B2",
    claims: `1. A method for scheduling compute workloads across a plurality of edge nodes in a mesh network, comprising: receiving, at a coordinator node, capacity advertisements from each of the plurality of edge nodes, each capacity advertisement indicating available compute resources and a current latency fingerprint; computing, by the coordinator, a placement cost for each candidate edge node using a learned cost model that balances energy consumption, expected completion time, and reliability; assigning the workload to the edge node minimizing said placement cost; forwarding the workload to the assigned edge node for execution; and upon completion, receiving a completion notification and updating the learned cost model based on observed completion time.
2. The method of claim 1, wherein the learned cost model is updated online using observed completion times and resource utilization metrics reported by the edge nodes.
3. The method of claim 1, wherein the coordinator is elected via a consensus protocol selected from the group consisting of Raft, Paxos, and Byzantine-fault-tolerant agreement.
4. The method of claim 1, wherein the latency fingerprint comprises a percentile distribution of round-trip times to neighboring nodes in the mesh.
5. The method of claim 1, further comprising, prior to assigning the workload, verifying that the candidate edge node has a current cryptographic attestation affirming integrity of its runtime environment.
6. The method of claim 5, wherein the cryptographic attestation is verified against a hardware root of trust provisioned at manufacture time.
7. The method of claim 1, wherein the placement cost further penalizes nodes whose capacity advertisement has not been refreshed within a threshold interval.
8. The method of claim 1, further comprising migrating an in-flight workload from a first edge node to a second edge node upon detecting degradation of the first edge node's capacity advertisement.
9. A system for scheduling compute workloads across an edge-compute mesh network, comprising: a coordinator module executing on a coordinator node, the coordinator module configured to receive capacity advertisements from a plurality of edge nodes, compute a placement cost for each candidate edge node using a learned cost model, and assign the workload to the edge node minimizing the placement cost; a plurality of edge nodes, each edge node configured to advertise capacity, receive assigned workloads, execute the workloads, and report completion; and a verifiable log storing workload assignment decisions for audit.
10. The system of claim 9, wherein the learned cost model is a gradient-boosted decision tree trained on historical workload completion data.
11. The system of claim 9, wherein the verifiable log is an append-only tamper-evident data structure.
12. The system of claim 9, wherein each edge node is further configured to publish a health metric comprising at least one of CPU temperature, memory pressure, and network ingress rate.
13. A non-transitory computer-readable medium storing instructions that, when executed by a processor, cause the processor to perform the method of claim 1.
14. The method of claim 1, wherein the workload is a containerized microservice and the assigned edge node pulls the container image from a registry prior to execution.`,
    description: `FIELD OF THE INVENTION
The present disclosure relates generally to distributed computing, and more particularly to adaptive scheduling of workloads across heterogeneous edge-compute nodes organized in a mesh topology.

BACKGROUND
Existing workload schedulers assume homogeneous data-center environments with stable, low-latency interconnects and well-characterized compute capacity. Edge-compute mesh networks depart sharply from these assumptions: nodes vary widely in architecture (CPU, GPU, NPU), capacity fluctuates as user-facing workloads consume resources, and inter-node connectivity is intermittent due to wireless backhaul and mobility. Conventional centralized schedulers therefore either overload hot nodes or under-utilize capacity that is briefly available at the network edge.

SUMMARY
The present disclosure describes a method, system, and computer-readable medium for adaptive scheduling of compute workloads across an edge-compute mesh. Each node advertises a capacity fingerprint comprising available compute, current latency distribution, and a cryptographic attestation of runtime integrity. A coordinator — itself elected via a Byzantine-fault-tolerant consensus protocol — computes a placement cost for each candidate node using a learned cost model that balances energy, expected completion time, and reliability, and assigns the workload to the node minimizing the placement cost. The cost model is updated online as completion observations arrive, allowing the scheduler to track drift in node capacity over time. In-flight workloads may be migrated when a node's capacity advertisement degrades beyond a threshold.

BRIEF DESCRIPTION OF THE DRAWINGS
FIG. 1 is a block diagram of an edge-compute mesh network according to one embodiment. FIG. 2 is a flow diagram of the scheduling method. FIG. 3 illustrates the structure of a capacity advertisement. FIG. 4 illustrates migration of an in-flight workload.

DETAILED DESCRIPTION
Embodiments will now be described with reference to the figures. In FIG. 1, the edge-compute mesh network 100 comprises a plurality of edge nodes 110a-110n interconnected by wireless or wired links 120. A coordinator node 130 is elected from among the edge nodes via a consensus protocol. The coordinator 130 maintains a learned cost model 140 and a verifiable log 150 storing workload assignment decisions for audit.

In operation, each edge node 110 periodically publishes a capacity advertisement comprising: (i) available compute resources (CPU cycles, GPU tensor-cores, NPU operations per second), (ii) a latency fingerprint comprising a percentile distribution of round-trip times to neighboring nodes, and (iii) a cryptographic attestation affirming integrity of the node's runtime environment, verified against a hardware root of trust provisioned at manufacture time. The coordinator 130 receives the capacity advertisements, computes a placement cost for each candidate edge node, and assigns the workload to the node minimizing the placement cost. The placement cost balances energy consumption, expected completion time (derived from the learned cost model 140), and a reliability penalty applied to nodes whose capacity advertisement has not been refreshed within a threshold interval. Upon workload completion, the assigned edge node reports a completion notification, and the learned cost model 140 is updated online using the observed completion time and resource utilization metrics. In-flight workloads may be migrated from a first edge node to a second edge node upon detecting degradation of the first edge node's capacity advertisement, preserving availability.

The learned cost model 140 may be a gradient-boosted decision tree trained on historical workload completion data, a neural network, or any suitable regression model. The verifiable log 150 may be an append-only tamper-evident data structure such as a Merkle log or a blockchain. The coordinator 130 may be re-elected upon failure, partition, or detected compromise.`,
  },

  // ── EP3876543B1 — Low-power neural inference accelerator for wearable biosensors ──
  {
    patentNumber: "EP3876543B1",
    claims: `1. A neural inference accelerator integrated within a wearable biosensor, comprising: a quantized weight memory storing neural network weights in a low-precision format; a sparsity-aware compute array configured to skip multiply-accumulate operations for zero-valued activations; and an output post-processor configured to produce a diagnostic classification from the compute array's output.
2. The accelerator of claim 1, wherein the weights are stored in a 4-bit format.
3. The accelerator of claim 1, wherein the sparsity-aware compute array skips multiply-accumulate operations for zero-valued activations identified by a leading-bit indicator.
4. The accelerator of claim 1, wherein the compute array operates on a time-multiplexed basis sharing a single multiplier-accumulator across a column of activations.
5. The accelerator of claim 1, wherein the quantized weight memory is organized as a two-ported SRAM permitting concurrent weight fetch and weight update.
6. The accelerator of claim 1, further comprising a voltage-frequency scaling controller configured to reduce an operating voltage in response to a detected reduction in workload.
7. The accelerator of claim 6, wherein the voltage-frequency scaling controller further reduces the operating voltage in response to a battery state-of-charge below a threshold.
8. The accelerator of claim 1, wherein the output post-processor is configured to produce a multi-class diagnostic classification with confidence calibration.
9. The accelerator of claim 1, wherein the wearable biosensor is a wrist-worn device configured to acquire a photoplethysmogram signal.
10. The accelerator of claim 1, wherein the wearable biosensor is a patch-type device configured to acquire an electrocardiogram signal.
11. A method of operating a neural inference accelerator within a wearable biosensor, comprising: receiving a digitized biosignal; quantizing the digitized biosignal to a low-precision activation format; performing, by a sparsity-aware compute array, multiply-accumulate operations against quantized weights, skipping operations for zero-valued activations; and producing, by an output post-processor, a diagnostic classification.
12. The method of claim 11, further comprising reducing an operating voltage of the accelerator in response to a detected reduction in workload.
13. The method of claim 11, wherein the diagnostic classification is an arrhythmia classification and the method further comprises issuing an alert upon classification confidence exceeding a threshold.
14. A non-transitory computer-readable medium storing weight values and instructions that, when loaded into the accelerator of claim 1, cause the accelerator to produce the diagnostic classification.`,
    description: `FIELD OF THE INVENTION
The present disclosure relates to integrated circuits for neural network inference, and more particularly to low-power accelerators suitable for deployment within wearable biosensors.

BACKGROUND
Continuous physiological monitoring via wearable biosensors is constrained severely by energy. Conventional neural inference accelerators are optimized for throughput rather than energy efficiency, making them unsuitable for battery-powered devices that must operate for days or weeks between charges. Existing low-power approaches reduce precision uniformly but do not exploit activation sparsity that arises naturally in ReLU-based networks, where a substantial fraction of activations are zero.

SUMMARY
The present disclosure describes a neural inference accelerator integrated within a wearable biosensor. The accelerator stores weights in a low-precision (4-bit) format, employs a sparsity-aware compute array that skips multiply-accumulate operations for zero-valued activations, and includes an output post-processor that produces a diagnostic classification. A voltage-frequency scaling controller reduces the operating voltage in response to workload reduction or low battery state-of-charge.

BRIEF DESCRIPTION OF THE DRAWINGS
FIG. 1 is a block diagram of the accelerator. FIG. 2 illustrates the sparsity-aware compute array. FIG. 3 illustrates the voltage-frequency scaling controller. FIG. 4 illustrates an exemplary wearable biosensor.

DETAILED DESCRIPTION
With reference to FIG. 1, the neural inference accelerator 200 comprises a quantized weight memory 210, a sparsity-aware compute array 220, and an output post-processor 230. The quantized weight memory 210 stores neural network weights in a 4-bit format, organized as a two-ported SRAM permitting concurrent weight fetch and weight update — supporting online adaptation without interrupting inference. The sparsity-aware compute array 220 (FIG. 2) performs multiply-accumulate operations against the quantized weights, and is configured to skip operations for zero-valued activations identified by a leading-bit indicator. A single multiplier-accumulator may be time-multiplexed across a column of activations, reducing silicon area. A voltage-frequency scaling controller 240 (FIG. 3) reduces the operating voltage in response to a detected reduction in workload, and further reduces the operating voltage in response to a battery state-of-charge below a threshold, extending operational lifetime. The output post-processor 230 produces a multi-class diagnostic classification with confidence calibration. In exemplary embodiments, the wearable biosensor is a wrist-worn device acquiring a photoplethysmogram signal, or a patch-type device acquiring an electrocardiogram signal, and the diagnostic classification is an arrhythmia classification with an alert issued upon confidence exceeding a threshold.`,
  },

  // ── IN3456789A1 — Modular photovoltaic mounting system ──
  {
    patentNumber: "IN3456789A1",
    claims: `1. A modular photovoltaic mounting system comprising: a ballasted triangular rail adjustable to a roof's geometry; a tool-less clamp affixing a photovoltaic panel to said rail; and a load-distribution pad disposed between said rail and a roof waterproofing membrane.
2. The system of claim 1, wherein the rail is adjustable along two axes permitting adaptation to a non-planar roof surface.
3. The system of claim 1, wherein the ballast is provided by a plurality of removable concrete blocks sized to permit manual placement without lifting equipment.
4. The system of claim 1, wherein the tool-less clamp engages a photovoltaic panel frame via a cam-action lever.
5. The system of claim 4, wherein the cam-action lever is lockable against vibration with a secondary detent.
6. The system of claim 1, wherein the load-distribution pad is formed of an elastomeric material exhibiting a durometer hardness between 40 and 60 on the Shore A scale.
7. The system of claim 1, wherein the triangular rail comprises an extruded aluminum section having a longitudinal channel for receiving the tool-less clamp at any point along a length of the rail.
8. The system of claim 1, further comprising a cable-management raceway integrally formed along a lower edge of the rail.
9. The system of claim 8, wherein the cable-management raceway is enclosed by a snap-fit cover removable without tools.
10. The system of claim 1, wherein the rail is configured to be joined end-to-end with a second rail of like kind to extend a mounting run beyond a single rail length.
11. A method of installing a photovoltaic panel on an asymmetric rooftop, comprising: placing a load-distribution pad upon the rooftop; positioning a ballasted triangular rail upon the pad; adjusting the rail along two axes to conform to the rooftop's geometry; and affixing the photovoltaic panel to the rail via a tool-less clamp without penetrating the waterproofing membrane.
12. The method of claim 11, further comprising routing a direct-current cable through a cable-management raceway integrally formed along a lower edge of the rail.
13. The method of claim 11, wherein the rail is joined end-to-end with a second rail to extend a mounting run.`,
    description: `FIELD OF THE INVENTION
The present disclosure relates to mounting systems for photovoltaic panels, and more particularly to modular, ballasted mounting systems adapted to asymmetric and irregular rooftops common in dense urban environments.

BACKGROUND
Conventional photovoltaic mounting systems require penetration of the roof waterproofing membrane to anchor mounting rails. Such penetrations introduce leak risk, accelerate membrane aging, and may void roof warranties. Non-ballasted systems additionally presume a planar, regular roof surface, which is uncommon on residential and small-commercial rooftops in dense urban environments where asymmetry, parapets, and existing penetrations dominate.

SUMMARY
The present disclosure describes a modular photovoltaic mounting system comprising a ballasted triangular rail adjustable to a roof's geometry, a tool-less clamp affixing a panel to the rail, and a load-distribution pad protecting the waterproofing membrane. The rail is adjustable along two axes to accommodate non-planar roof surfaces, joined end-to-end for longer runs, and includes an integral cable-management raceway.

BRIEF DESCRIPTION OF THE DRAWINGS
FIG. 1 is an exploded view of the mounting system. FIG. 2 illustrates the triangular rail and load-distribution pad. FIG. 3 illustrates the tool-less clamp. FIG. 4 illustrates an end-to-end rail joint.

DETAILED DESCRIPTION
With reference to the figures, the modular photovoltaic mounting system 300 comprises a ballasted triangular rail 310, a tool-less clamp 320, and a load-distribution pad 330. The triangular rail 310 is an extruded aluminum section having a longitudinal channel receiving the tool-less clamp 320 at any point along its length, and is adjustable along two axes to conform to non-planar roof surfaces. Ballast is provided by removable concrete blocks sized to permit manual placement without lifting equipment. The tool-less clamp 320 engages a photovoltaic panel frame via a cam-action lever lockable against vibration with a secondary detent. The load-distribution pad 330 is formed of an elastomeric material exhibiting a durometer hardness between 40 and 60 on the Shore A scale, protecting the roof waterproofing membrane without penetration. A cable-management raceway 340 is integrally formed along a lower edge of the rail 310 and enclosed by a snap-fit cover removable without tools. The rail 310 is configured to be joined end-to-end with a second rail of like kind via a concealed splice plate, extending a mounting run beyond a single rail length. The system thus adapts to asymmetric rooftops without membrane penetration, without lifting equipment, and without on-site fabrication.`,
  },

  // ── US10987654B1 — Cryptographic key rotation for multi-party data pipelines ──
  {
    patentNumber: "US10987654B1",
    claims: `1. A method for rotating cryptographic keys across a plurality of pipeline stages, comprising: publishing a commit for a new key to a verifiable log; upon a quorum of the pipeline stages acknowledging the commit, revealing the new key to the pipeline stages; and atomically switching each stage to encrypt subsequent outputs with the new key.
2. The method of claim 1, wherein the verifiable log is a tamper-evident append-only data structure.
3. The method of claim 2, wherein the verifiable log is a Merkle log and the commit comprises a hash of the new key.
4. The method of claim 1, wherein the quorum is a supermajority of the pipeline stages.
5. The method of claim 1, further comprising, prior to revealing the new key, verifying that each acknowledging stage has attested to integrity of its runtime environment.
6. The method of claim 1, further comprising decrypting, by each stage, in-flight outputs encrypted under a prior key using the prior key retained in a bounded-retention cache.
7. The method of claim 6, wherein the bounded-retention cache is purged after a drain interval following completion of in-flight decryption.
8. The method of claim 1, wherein revealing the new key to the pipeline stages is performed via a threshold secret-sharing scheme requiring cooperation of at least a threshold number of trustees.
9. The method of claim 1, further comprising writing, to the verifiable log, an entry attesting to the atomic switch.
10. The method of claim 1, further comprising detecting a failure of a pipeline stage to switch to the new key within a deadline and, in response, quarantining the failing stage.
11. A system for rotating cryptographic keys across a plurality of pipeline stages, comprising: a verifiable log; a commit module configured to publish a commit for a new key to the verifiable log; an acknowledgement tracker configured to detect a quorum of acknowledgements from the pipeline stages; a reveal module configured to reveal the new key upon the quorum; and a switch coordinator configured to instruct each stage to atomically switch to the new key.
12. The system of claim 11, wherein the verifiable log is a Merkle log and the commit module publishes a hash of the new key.
13. A non-transitory computer-readable medium storing instructions that, when executed by a processor, cause the processor to perform the method of claim 1.
14. The method of claim 1, wherein the plurality of pipeline stages are mutually distrusting and operated by distinct organizations.`,
    description: `FIELD OF THE INVENTION
The present disclosure relates to cryptographic key management, and more particularly to rotation of cryptographic keys across multiple mutually-distrusting stages of a data pipeline without halting data flow.

BACKGROUND
Multi-party data pipelines — in which successive processing stages are operated by distinct organizations that do not fully trust one another — require that data flowing between stages be encrypted with keys whose rotation is coordinated. Conventional rotation requires halting the pipeline, which is unacceptable for continuous-processing pipelines. Naive approaches that reveal a new key before all stages are ready create a window in which a compromised stage may decrypt future traffic.

SUMMARY
The present disclosure describes a commit-reveal scheme for rotating cryptographic keys across a plurality of pipeline stages. A commit for a new key is published to a verifiable log; upon a supermajority quorum of stages acknowledging the commit, the new key is revealed; and each stage atomically switches to encrypt subsequent outputs with the new key. In-flight outputs encrypted under the prior key are decrypted using the prior key retained in a bounded-retention cache, which is purged after a drain interval. The verifiable log preserves an audit trail of commits, acknowledgements, and switches.

BRIEF DESCRIPTION OF THE DRAWINGS
FIG. 1 is a block diagram of a multi-party data pipeline. FIG. 2 is a message sequence chart of the commit-reveal-rotate scheme. FIG. 3 illustrates the verifiable log structure. FIG. 4 illustrates the bounded-retention cache.

DETAILED DESCRIPTION
With reference to FIG. 1, the multi-party data pipeline 400 comprises a plurality of stages 410a-410n operated by distinct organizations. A verifiable log 420 — an append-only tamper-evident data structure such as a Merkle log — is shared among the stages. A commit module 430 publishes, to the verifiable log 420, a commit comprising a hash of a new key. An acknowledgement tracker 440 detects acknowledgements from the pipeline stages 410; upon a supermajority quorum of acknowledgements, a reveal module 450 reveals the new key to the pipeline stages 410 (in one embodiment, via a threshold secret-sharing scheme requiring cooperation of at least a threshold number of trustees). A switch coordinator 460 then instructs each stage 410 to atomically switch to encrypt subsequent outputs with the new key. Each stage 410 retains the prior key in a bounded-retention cache 470 to decrypt in-flight outputs encrypted under the prior key; the cache 470 is purged after a drain interval following completion of in-flight decryption, bounding exposure of the prior key. An entry attesting to the atomic switch is written to the verifiable log 420. A failure of a pipeline stage 410 to switch to the new key within a deadline is detected, and the failing stage is quarantined, preserving pipeline integrity. Prior to revealing the new key, each acknowledging stage may be required to attest to integrity of its runtime environment.`,
  },

  // ── US11445566B2 — Federated learning for cross-hospital diagnostic models ──
  {
    patentNumber: "US11445566B2",
    claims: `1. A federated learning method for training a diagnostic model across a plurality of hospitals, comprising: at each hospital, computing a model update on local private data; applying institution-specific differential-privacy noise to the model update; transmitting the noisy model update to a coordinator; and aggregating, by the coordinator, the noisy model updates into a global model.
2. The method of claim 1, further comprising attributing each model update's contribution to a participating hospital for revenue sharing.
3. The method of claim 1, wherein the differential-privacy noise has a magnitude calibrated to a per-institution privacy budget.
4. The method of claim 3, wherein the per-institution privacy budget is exhausted over a defined training campaign and the hospital is excluded from further rounds upon exhaustion.
5. The method of claim 1, wherein the coordinator applies secure aggregation such that individual hospital updates are not visible to the coordinator in the clear.
6. The method of claim 1, further comprising, prior to aggregating, filtering a model update identified as anomalous by a Byzantine-robust aggregation rule.
7. The method of claim 1, wherein the diagnostic model is a deep neural network for image classification and the local private data comprises medical images.
8. The method of claim 1, wherein the diagnostic model is a sequence model for clinical text and the local private data comprises clinical notes.
9. The method of claim 1, wherein the global model is distributed back to the hospitals at the conclusion of each round.
10. The method of claim 1, wherein the noisy model update is transmitted over a mutually-authenticated channel with forward secrecy.
11. A system for federated learning of a diagnostic model across a plurality of hospitals, comprising: a coordinator module configured to receive noisy model updates from the hospitals, aggregate the updates into a global model, and distribute the global model back to the hospitals; and a per-hospital training module configured to compute a model update on local private data, apply institution-specific differential-privacy noise, and transmit the noisy update.
12. The system of claim 11, wherein the coordinator module applies secure aggregation such that individual hospital updates are not visible in the clear.
13. A non-transitory computer-readable medium storing instructions that, when executed by a processor at a hospital, cause the processor to perform the per-hospital steps of the method of claim 1.
14. The method of claim 1, further comprising auditing attribution of each model update for revenue sharing against a tamper-evident log.`,
    description: `FIELD OF THE INVENTION
The present disclosure relates to federated machine learning, and more particularly to frameworks enabling multiple hospitals to jointly train diagnostic models on private patient data without centralizing it.

BACKGROUND
Diagnostic machine-learning models benefit from training data drawn across many institutions to generalize across patient populations. However, centralizing patient data across hospitals raises substantial privacy, regulatory, and sovereignty concerns, and is frequently prohibited. Conventional federated learning does not account for institution-specific privacy budgets, does not provide contribution attribution needed for revenue sharing among participating institutions, and is vulnerable to Byzantine participants.

SUMMARY
The present disclosure describes a federated learning framework in which each hospital computes a model update on local private data, applies institution-specific differential-privacy noise calibrated to a per-institution privacy budget, transmits the noisy update to a coordinator, and the coordinator aggregates the updates into a global model. Contribution attribution is recorded for revenue sharing. The coordinator may apply secure aggregation so individual updates are not visible in the clear, and may filter anomalous updates via a Byzantine-robust aggregation rule.

BRIEF DESCRIPTION OF THE DRAWINGS
FIG. 1 is a block diagram of the federated learning framework. FIG. 2 is a flow diagram of a training round. FIG. 3 illustrates the per-institution privacy budget. FIG. 4 illustrates contribution attribution.

DETAILED DESCRIPTION
With reference to FIG. 1, the federated learning framework 500 comprises a coordinator module 510 and a plurality of per-hospital training modules 520a-520n. In each training round (FIG. 2), each per-hospital training module 520 computes a model update on local private data, applies institution-specific differential-privacy noise calibrated to a per-institution privacy budget (FIG. 3), and transmits the noisy update over a mutually-authenticated channel with forward secrecy to the coordinator module 510. The coordinator module 510 may apply secure aggregation such that individual hospital updates are not visible in the clear, may filter anomalous updates via a Byzantine-robust aggregation rule, and aggregates the updates into a global model. Contribution attribution (FIG. 4) is recorded against a tamper-evident log for revenue sharing. The global model is distributed back to the hospitals at the conclusion of each round. A per-institution privacy budget is exhausted over a defined training campaign, and a hospital is excluded from further rounds upon exhaustion. In exemplary embodiments, the diagnostic model is a deep neural network for medical-image classification and the local private data comprises medical images, or the diagnostic model is a sequence model for clinical text and the local private data comprises clinical notes.`,
  },

  // ── WO2021154321A1 — Biodegradable polymer blend for compostable packaging ──
  {
    patentNumber: "WO2021154321A1",
    claims: `1. A biodegradable polymer blend comprising: 60-80% by weight agricultural waste starch; 10-25% by weight of a compatibilizing agent; and 5-15% by weight of a plasticizer.
2. The blend of claim 1, formed into a film of thickness 20-80 microns exhibiting an oxygen transmission rate below 50 cc/m²/day.
3. The blend of claim 1, wherein the agricultural waste starch is selected from the group consisting of cassava starch, potato starch, and rice starch.
4. The blend of claim 1, wherein the compatibilizing agent is a maleic-anhydride-grafted thermoplastic starch.
5. The blend of claim 1, wherein the plasticizer is glycerol.
6. The blend of claim 1, further comprising 0.5-2% by weight of a hydrophobic wax to reduce moisture absorption.
7. The blend of claim 1, further comprising 0.1-1% by weight of a process stabilizer selected from the group consisting of ascorbic acid and citric acid.
8. The blend of claim 1, wherein the blend exhibits a tensile strength of at least 15 MPa.
9. The blend of claim 1, wherein the blend is biodegradable under industrial composting conditions within 90 days.
10. The blend of claim 1, wherein the blend is processable on conventional blown-film equipment.
11. A method of producing a biodegradable polymer film, comprising: blending 60-80% by weight agricultural waste starch, 10-25% by weight of a compatibilizing agent, and 5-15% by weight of a plasticizer; compounding the blend under controlled moisture; and forming the compounded blend into a film of thickness 20-80 microns.
12. The method of claim 11, wherein compounding is performed at a temperature below 160 degrees Celsius to avoid starch degradation.
13. The method of claim 11, further comprising adding 0.5-2% by weight of a hydrophobic wax to reduce moisture absorption.
14. An article of compostable food packaging formed from the blend of claim 1.`,
    description: `FIELD OF THE INVENTION
The present disclosure relates to biodegradable polymer blends, and more particularly to blends derived from agricultural waste starch suitable for compostable food-packaging films.

BACKGROUND
Conventional food-packaging films are predominantly derived from petroleum-based polymers such as polyethylene and polypropylene, which persist in the environment for centuries. Starch-based biopolymers are renewable and biodegradable but exhibit poor moisture resistance and oxygen-barrier performance unsuitable for food packaging. Existing compatibilized starch blends require high proportions of synthetic polymers to achieve adequate mechanical and barrier properties, undermining their biodegradability claims.

SUMMARY
The present disclosure describes a biodegradable polymer blend comprising 60-80% by weight agricultural waste starch, 10-25% by weight of a compatibilizing agent, and 5-15% by weight of a plasticizer, processable on conventional blown-film equipment into films exhibiting oxygen transmission rates below 50 cc/m²/day and biodegradable under industrial composting conditions within 90 days.

BRIEF DESCRIPTION OF THE DRAWINGS
FIG. 1 is a process flow diagram. FIG. 2 illustrates the blend composition. FIG. 3 illustrates oxygen transmission rate vs. film thickness. FIG. 4 illustrates tensile strength vs. plasticizer content.

DETAILED DESCRIPTION
The biodegradable polymer blend comprises 60-80% by weight agricultural waste starch selected from cassava, potato, and rice starch; 10-25% by weight of a compatibilizing agent such as maleic-anhydride-grafted thermoplastic starch; and 5-15% by weight of a plasticizer such as glycerol. A hydrophobic wax (0.5-2% by weight) may be added to reduce moisture absorption, and a process stabilizer (0.1-1% by weight) such as ascorbic acid or citric acid may be added to limit starch degradation during compounding. The blend is compounded under controlled moisture at a temperature below 160 degrees Celsius to avoid starch degradation, and formed on conventional blown-film equipment into a film of thickness 20-80 microns. The resulting film exhibits an oxygen transmission rate below 50 cc/m²/day, a tensile strength of at least 15 MPa, and is biodegradable under industrial composting conditions within 90 days. Articles of compostable food packaging formed from the blend — including wrappers, pouches, and liners — are within the scope of the present disclosure.`,
  },
];

async function main() {
  console.log(`=== Enriching ${ENRICHMENTS.length} patents with full claims + descriptions ===\n`);

  let updated = 0;
  let skipped = 0;

  for (const e of ENRICHMENTS) {
    const existing = await db.patent.findFirst({
      where: { patentNumber: e.patentNumber },
      select: { id: true, claims: true, dataSource: true },
    });

    if (!existing) {
      console.log(`  ✗ ${e.patentNumber} — NOT FOUND in DB, skipping`);
      skipped++;
      continue;
    }

    const claimCount = (e.claims.match(/\b\d+\s*\.\s/g) || []).length;
    const descLen = e.description.length;
    const claimsLen = e.claims.length;

    await db.patent.update({
      where: { id: existing.id },
      data: {
        claims: e.claims,
        description: e.description,
        // Honest provenance — clearly NOT real fetched data.
        dataSource: "demo-enriched",
      },
    });

    console.log(
      `  ✓ ${e.patentNumber} — ${claimCount} claims, ${claimsLen} chars; description ${descLen} chars`,
    );
    updated++;
  }

  console.log(
    `\n=== Done: ${updated} updated, ${skipped} skipped ===\n` +
      `All enriched patents are tagged dataSource="demo-enriched" to distinguish ` +
      `them from real fetched data. To replace with REAL claims, run fetch-patents.ts ` +
      `from an environment with Google Patents access, then seed-patents.ts.`,
  );

  // Final verification
  const verify = await db.patent.findMany({
    where: { published: true },
    select: { patentNumber: true, claims: true, dataSource: true },
    orderBy: { patentNumber: "asc" },
  });
  console.log(`\n=== Verification ===`);
  for (const p of verify) {
    const n = (p.claims.match(/\b\d+\s*\.\s/g) || []).length;
    console.log(
      `  ${p.patentNumber} — ${p.claims.length} chars, ${n} claims, dataSource=${p.dataSource}`,
    );
  }
}

main()
  .catch((err) => {
    console.error("Enrichment failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
