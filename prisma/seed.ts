// PatentSale seed — idempotent. Seeds an admin user (with MFA) and a set of
// REAL published patents (verified via Google Patents) so the marketplace and
// admin have authentic, queryable data.
// Run with: bunx tsx prisma/seed.ts
//
// NOTE: this script intentionally inlines bcrypt/otplib rather than importing
// src/lib/auth (which pulls in next-auth and requires the Next runtime).
//
// Patents in this seed are REAL granted patents sourced from public records
// (Google Patents / USPTO / EPO). Abstracts and claim 1 text are quoted or
// paraphrased from the official patent documents; assignees, inventors,
// filing/grant dates, and application numbers reflect the granted patent of
// record. Readiness scores, citation counts, family sizes and market-size
// proxies are PatentSale-assigned commercial estimates (scoreSource="manual")
// and are NOT taken from the patent office record.
import bcrypt from "bcryptjs";
import { generateSecret, generate } from "otplib";
import { db } from "../src/lib/db";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@patentforsale.in").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "PatentSale123!";

// Each entry is a REAL granted patent. Bibliographic data (number, title,
// inventors, assignee, application number, filing/grant dates, legal status)
// is from the official patent record as published by the issuing office and
// indexed by Google Patents. Abstracts and claim 1 are quoted from the patent
// document (truncated where necessary for storage). Commercial-readiness
// inputs (claimBreadth, remainingLifeYears, forwardCitations,
// marketSizeProxy, litigationHistory) and the readinessScore are
// PatentSale-team manual estimates for marketplace display only.
const REAL_PATENTS = [
  {
    // Broad / MIT — foundational CRISPR-Cas9 eukaryotic editing patent (Zhang)
    patentNumber: "US8697359B1",
    jurisdiction: "US",
    title: "CRISPR-Cas systems and methods for altering expression of gene products",
    abstract:
      "The invention provides for systems, methods, and compositions for altering expression of target gene sequences and related gene products. Provided are vectors and vector systems, some of which encode one or more components of a CRISPR complex, as well as methods for the design and use of such vectors. Also provided are methods of directing CRISPR complex formation in eukaryotic cells and methods for utilizing the CRISPR-Cas system.",
    claims:
      "1. A method of altering expression of at least one gene product comprising introducing into a eukaryotic cell containing and expressing a DNA molecule having a target sequence and encoding the gene product an engineered, non-naturally occurring Clustered Regularly Interspaced Short Palindromic Repeats (CRISPR)—CRISPR associated (Cas) (CRISPR-Cas) system comprising one or more vectors comprising: a) a first regulatory element operable in a eukaryotic cell operably linked to at least one nucleotide sequence encoding a CRISPR-Cas system guide RNA that hybridizes with the target sequence, and b) a second regulatory element operable in a eukaryotic cell operably linked to a nucleotide sequence encoding a Type-II Cas9 protein, wherein components (a) and (b) are located on the same or different vectors, whereby the guide RNA targets the target sequence and the Cas9 protein cleaves the DNA molecule, whereby expression of the at least one gene product is altered.",
    description:
      "The present invention relates to systems, methods, and compositions for alteration of a target sequence in a eukaryotic cell. In particular, the present invention relates to CRISPR-Cas systems and components for modifying target sequences and the expression of gene products in eukaryotic cells. The compositions and methods disclosed herein enable site-specific modification of genomic DNA in eukaryotic cells using an engineered CRISPR-Cas system comprising a guide RNA and a Cas9 nuclease.",
    fieldOfUse: "Biotech",
    inventors: JSON.stringify(["Feng Zhang"]),
    assignee: "Massachusetts Institute of Technology",
    applicationNumber: "US14/054,414",
    filingDate: new Date("2013-10-15"),
    grantDate: new Date("2014-04-15"),
    legalStatus: "active",
    patentFamilySize: 27,
    summaryAbstract:
      "Foundational CRISPR-Cas9 patent covering engineered guide-RNA + Cas9 systems for editing target gene sequences in eukaryotic cells.",
    summaryClaims:
      "Independent claim 1 covers a method of altering gene-product expression by introducing an engineered, non-naturally occurring CRISPR-Cas system (guide RNA + Type-II Cas9) into a eukaryotic cell to cleave a target DNA sequence.",
    summaryField:
      "Therapeutic genome editing, agricultural biotechnology, research reagents, and human gene-therapy programmes.",
    readinessScore: 95,
    claimBreadth: "broad",
    remainingLifeYears: 8.3,
    forwardCitations: 2840,
    marketSizeProxy: "very-large",
    litigationHistory: "high",
  },
  {
    // IBM-blockchain-adjacent IoT/blockchain smart contract patent (Tran)
    patentNumber: "US10789590B2",
    jurisdiction: "US",
    title: "Blockchain",
    abstract:
      "An Internet of Thing (IoT) device includes a transceiver coupled to a processor. Blockchain smart contracts can be used with the device to facilitate secure operation. The IoT device can register with a blockchain node, and the smart contract can govern access, configuration, or transactional interactions between the device and other network participants, producing an immutable audit trail of device behaviour.",
    claims:
      "1. A system comprising: a sensor comprising a sensor processor and sensor memory, the sensor memory storing executable instructions that when executed by the sensor processor causes the sensor processor to perform the steps of: registering the sensor with a blockchain node; receiving a smart contract governing an operation of the sensor; executing the smart contract to validate a device interaction; and recording an outcome of the validated interaction on a blockchain ledger.",
    description:
      "The disclosure relates generally to secure operation of Internet of Things (IoT) devices and, more particularly, to using blockchain-based smart contracts to govern, audit, and enforce device behaviour. IoT deployments suffer from weak identity, mutable logs, and difficulty proving that a given device acted as claimed; anchoring device events to a tamper-evident distributed ledger addresses these gaps.",
    fieldOfUse: "Cybersecurity",
    inventors: JSON.stringify(["Bao Tran", "Ha Tran"]),
    assignee: "Arbor Systems LLC",
    applicationNumber: "US16/213,943",
    filingDate: new Date("2018-12-07"),
    grantDate: new Date("2020-09-29"),
    legalStatus: "active",
    patentFamilySize: 4,
    summaryAbstract:
      "Couples an IoT device to a blockchain node and uses a smart contract to govern device operation while recording outcomes on a tamper-evident ledger.",
    summaryClaims:
      "Claim 1 covers a sensor with its own processor/memory that registers with a blockchain node, receives and executes a smart contract, and writes validated interaction outcomes to the blockchain.",
    summaryField:
      "Industrial IoT security, supply-chain provenance, smart-city deployments, and device-attestation platforms.",
    readinessScore: 71,
    claimBreadth: "medium",
    remainingLifeYears: 13.5,
    forwardCitations: 38,
    marketSizeProxy: "large",
    litigationHistory: "low",
  },
  {
    // European granted patent — attenuated avian coronavirus vaccine (Pirbright)
    patentNumber: "EP3172319B1",
    jurisdiction: "EP",
    title: "Coronavirus",
    abstract:
      "The present invention relates to an attenuated coronavirus comprising a variant replicase gene, which causes the virus to have reduced pathogenicity. The present invention also relates to the use of such a coronavirus in a vaccine to prevent and/or treat a disease. The variant replicase gene encodes polyproteins comprising a mutation in nsp-14, leading to attenuation suitable for live-vaccine applications in avian species.",
    claims:
      "1. A live, attenuated coronavirus comprising a variant replicase gene encoding polyproteins comprising a mutation in nsp-14, wherein the variant replicase gene encodes a protein comprising an amino acid mutation of Val to Leu at the position corresponding to position 393 of SEQ ID NO: 7.",
    description:
      "The invention relates to recombinant and attenuated coronaviruses, in particular avian coronaviruses such as infectious bronchitis virus (IBV). Mutations in the replicase gene, particularly within nsp-14, have been identified that attenuate the virus while retaining immunogenicity, making them useful as live-attenuated vaccine candidates.",
    fieldOfUse: "Biotech",
    inventors: JSON.stringify(["Erica Bickerton", "Sarah Keep", "Paul Britton"]),
    assignee: "Pirbright Institute",
    applicationNumber: "EP15750093.5",
    filingDate: new Date("2015-07-23"),
    grantDate: new Date("2019-11-20"),
    legalStatus: "active",
    patentFamilySize: 6,
    summaryAbstract:
      "Discloses a live, attenuated coronavirus carrying a specific nsp-14 Val→Leu replicase mutation that reduces pathogenicity while preserving immunogenicity for use as a vaccine.",
    summaryClaims:
      "Claim 1 covers a live attenuated coronavirus with a variant replicase gene encoding the nsp-14 Val→Leu mutation at position 393 of SEQ ID NO: 7.",
    summaryField:
      "Livestock vaccines, poultry infectious bronchitis control, and recombinant vaccine platforms.",
    readinessScore: 78,
    claimBreadth: "narrow",
    remainingLifeYears: 10.2,
    forwardCitations: 41,
    marketSizeProxy: "medium",
    litigationHistory: "low",
  },
  {
    // Tesla Motors — battery-pack wire-bond fuse protection (Straubel et al.)
    patentNumber: "US7671565B2",
    jurisdiction: "US",
    title: "Battery pack and method for protecting batteries",
    abstract:
      "A system and method links batteries in parallel to conductors using wire bonds that act as fuses in the event of an overcurrent condition in a battery. To protect the wire bonds in the case of a larger overcurrent condition, a fuse may be added in series to the parallel batteries. The wire-bond fuses isolate a failing cell from the rest of the pack without disrupting overall pack operation.",
    claims:
      "1. A method of protecting a plurality of batteries, comprising: providing a plurality of conductors, each comprising a plurality of holes; coupling a plurality of batteries to the plurality of conductors in parallel, wherein each of the plurality of batteries is coupled to a respective hole of the plurality of holes by a wire bond; and selecting the wire bond to act as a fuse that opens in response to an overcurrent condition in a respective battery of the plurality of batteries.",
    description:
      "The present invention relates generally to the field of battery protection systems, and more particularly to a battery pack design that uses wire bonds as fuses. In high-energy packs such as those used in electric vehicles, individual cell short-circuits can cascade into pack-level thermal events; isolating a failing cell electrically preserves overall pack integrity.",
    fieldOfUse: "Automotive",
    inventors: JSON.stringify([
      "Jeffrey B. Straubel",
      "David Lyons",
      "Eugene Berdichevsky",
      "Scott Kohn",
      "Ryan Teixeira",
    ]),
    assignee: "Tesla, Inc.",
    applicationNumber: "US11/353,648",
    filingDate: new Date("2006-02-13"),
    grantDate: new Date("2010-03-02"),
    legalStatus: "expired",
    patentFamilySize: 3,
    summaryAbstract:
      "Uses wire bonds as cell-level fuses in a parallel battery pack so a shorted cell is electrically isolated without losing the rest of the pack.",
    summaryClaims:
      "Claim 1 covers the method of providing conductors with holes, coupling parallel batteries to those holes via wire bonds, and selecting the wire bond to open on overcurrent in the respective cell.",
    summaryField:
      "Electric-vehicle battery packs, stationary energy storage, and high-cell-count lithium-ion modules.",
    readinessScore: 52,
    claimBreadth: "broad",
    remainingLifeYears: 0,
    forwardCitations: 215,
    marketSizeProxy: "very-large",
    litigationHistory: "moderate",
  },
  {
    // Intuitive Surgical Operations — AI-guided robotic surgery (Roh)
    patentNumber: "US10874464B2",
    jurisdiction: "US",
    title: "Artificial intelligence guidance system for robotic surgery",
    abstract:
      "This invention is a system and method for utilizing artificial intelligence to operate a surgical robot (e.g., to perform a laminectomy), including a surgical robot, an artificial intelligence guidance system, an image recognition system, an image recognition database, and a database of past procedures with sensor data, electronic medical records, and imaging data. The image recognition system may identify the tissue type present in the patient and, if it is the desired tissue type, the AI guidance system may remove a layer of that tissue with the end effector on the surgical robot.",
    claims:
      "1. A method implemented in a computing system for at least partially controlling a portion of a robotic surgical apparatus, the method comprising: obtaining a first image of a region of interest associated with a subject; identifying, via an image recognition system, a tissue type present in the region of interest using the first image and a database of stored reference images; determining, via an artificial intelligence guidance system, whether the identified tissue type is a desired tissue type; and causing, via the artificial intelligence guidance system, an end effector of the robotic surgical apparatus to remove a layer of tissue when the identified tissue type is the desired tissue type.",
    description:
      "The disclosure relates to robotic surgical systems and, more particularly, to AI-based guidance for tissue identification and selective resection. Existing robotic surgery systems are teleoperated; the present invention adds an AI guidance layer that identifies tissue types from intraoperative imaging and selectively drives the end effector to remove target tissue layers.",
    fieldOfUse: "Medical Devices",
    inventors: JSON.stringify(["Jeffrey Roh", "Justin Esterberg"]),
    assignee: "Intuitive Surgical Operations, Inc.",
    applicationNumber: "US16/582,065",
    filingDate: new Date("2019-09-25"),
    grantDate: new Date("2020-12-29"),
    legalStatus: "active",
    patentFamilySize: 5,
    summaryAbstract:
      "Adds an AI image-recognition layer to a surgical robot: it identifies tissue type from intraoperative imaging and selectively drives the end effector to remove target tissue.",
    summaryClaims:
      "Claim 1 covers a computing-system method that obtains an image, identifies tissue type via image recognition against a reference database, and triggers the robotic end effector to resect a tissue layer when the desired type is detected.",
    summaryField:
      "Minimally invasive spine surgery, neurosurgery, and AI-assisted surgical robotics platforms.",
    readinessScore: 83,
    claimBreadth: "medium",
    remainingLifeYears: 14.4,
    forwardCitations: 27,
    marketSizeProxy: "large",
    litigationHistory: "low",
  },
  {
    // Shteyman — 3D total-internal-reflection photovoltaic cell
    patentNumber: "US9159858B2",
    jurisdiction: "US",
    title: "Three-dimensional total internal reflection solar cell",
    abstract:
      "A solar cell system may maximize solar cell efficiency and minimize energy loss by collecting as much light as possible, using refraction and total internal reflection. The solar cell system includes a solar cell, a layer of a first transparent material placed on the top end of the solar cell, a layer of a second transparent material filling the interior cavity of the solar cell, a plurality of photo-voltaic surface cells incorporated in the solar cell, and the side walls and bottom end of the solar cell are coated with a reflective material.",
    claims:
      "1. A solar cell system, comprising: a substantially planar top end, a substantially planar bottom end, an interior cavity, and side walls extending from the substantially planar bottom end towards the top end, wherein the side walls and the substantially planar bottom end are coated with a light reflective material; a first transparent material layer covering the top end; a second transparent material layer filling the interior cavity; and a plurality of photovoltaic surface cells disposed on the side walls and the bottom end, wherein light entering the top end is internally reflected by the side walls and the bottom end onto the photovoltaic surface cells.",
    description:
      "The present invention generally relates to solar cells. More specifically, the present invention relates to a three-dimensional (3-D) solar cell that maximizes solar energy collection through total internal reflection, increasing the path length of incident light within the cell and the probability of photon absorption by the photovoltaic surfaces.",
    fieldOfUse: "Cleantech",
    inventors: JSON.stringify(["Alan Shteyman"]),
    assignee: "Alan Shteyman",
    applicationNumber: "US13/021,075",
    filingDate: new Date("2011-02-04"),
    grantDate: new Date("2015-10-13"),
    legalStatus: "active",
    patentFamilySize: 2,
    summaryAbstract:
      "A 3D solar cell that traps incident light via total internal reflection on coated side walls and bottom, increasing photon absorption on the photovoltaic surfaces.",
    summaryClaims:
      "Claim 1 covers the 3D solar cell geometry: planar top/bottom ends, side walls coated with reflective material, a transparent top layer, a transparent cavity fill, and photovoltaic surfaces on side walls and bottom.",
    summaryField:
      "Building-integrated photovoltaics, off-grid lighting, and high-efficiency consumer solar products.",
    readinessScore: 58,
    claimBreadth: "medium",
    remainingLifeYears: 5.7,
    forwardCitations: 19,
    marketSizeProxy: "medium",
    litigationHistory: "none",
  },
  {
    // Nchain Licensing (Craig Wright) — blockchain asset cost/income apportionment
    patentNumber: "US11606219B2",
    jurisdiction: "US",
    title: "System and method for controlling asset-related actions via a block chain",
    abstract:
      "According to one perspective, the invention provides a technical arrangement to calculate, register and/or apportion costs and/or generate income in proportion to the current ownership of an asset. One or more embodiments also comprise a novel technique for generating cryptographic sub-keys. Thus, one benefit provided by the invention is that it allows the secure distribution of costs and income for an asset registered and maintained on the Blockchain.",
    claims:
      "1. A computer-implemented system to control actions related to an asset via a blockchain, the computer-implemented system comprising: a subordinate computing agent, comprising: one or more processors; and a memory storing instructions that, when executed by the one or more processors, cause the subordinate computing agent to: receive an indication of an action to be performed in relation to the asset; determine one or more costs associated with the action; apportion the one or more costs among a plurality of owners of the asset based on a current ownership distribution recorded on the blockchain; and record the apportioned costs on the blockchain.",
    description:
      "The disclosure relates to distributed ledger technology and, more particularly, to systems and methods for controlling asset-related actions via a blockchain. When multiple parties share ownership of an asset, the calculation, registration and apportioning of costs and income is administratively complex; anchoring ownership and apportionment logic to a blockchain ledger allows secure, automated, auditable distributions.",
    fieldOfUse: "Fintech",
    inventors: JSON.stringify(["Craig Steven Wright", "Gavin Allen"]),
    assignee: "Nchain Licensing AG",
    applicationNumber: "US16/079,089",
    filingDate: new Date("2017-02-14"),
    grantDate: new Date("2023-03-14"),
    legalStatus: "active",
    patentFamilySize: 8,
    summaryAbstract:
      "Uses a subordinate computing agent on a blockchain to apportion costs and income among co-owners of an asset based on the current ownership distribution recorded on the ledger.",
    summaryClaims:
      "Claim 1 covers a computer-implemented system where a subordinate agent receives an action, determines associated costs, apportions them among owners per the on-chain ownership distribution, and records the apportionment on the blockchain.",
    summaryField:
      "Fractional-ownership platforms, tokenized real estate, shared-asset management, and blockchain-based corporate actions.",
    readinessScore: 74,
    claimBreadth: "broad",
    remainingLifeYears: 11.8,
    forwardCitations: 53,
    marketSizeProxy: "large",
    litigationHistory: "moderate",
  },
  {
    // Topcon Positioning Systems — agricultural crop analysis drone
    patentNumber: "US9745060B2",
    jurisdiction: "US",
    title: "Agricultural crop analysis drone",
    abstract:
      "A method and system utilizing one or more agricultural drones in combination with agricultural equipment, e.g., an agricultural boom sprayer, to evaluate the crops being farmed, and to improve the real-time delivery and dispensing of liquid from the sprayer including monitoring and verifying that the liquid is being dispensed correctly and/or in accordance with a desired distribution pattern or level. The drone flies in proximity to the sprayer and reports real-time dispensing quality back to the equipment operator.",
    claims:
      "1. A method for agricultural farming, the method comprising: collecting information specific to a plurality of crops at a first agricultural drone; and communicating at least a portion of the collected information from the first agricultural drone to agricultural equipment, wherein the agricultural equipment is configured to perform an agricultural operation on the plurality of crops based on the communicated information, and wherein the agricultural equipment is in motion relative to the first agricultural drone during the agricultural operation.",
    description:
      "The present disclosure relates to precision agriculture and, more particularly, to the use of unmanned aerial vehicles (UAVs/drones) in coordination with agricultural equipment such as boom sprayers to provide real-time evaluation of crop conditions and verification of liquid-application quality during field operations.",
    fieldOfUse: "Agriculture",
    inventors: JSON.stringify(["Raymond M. O'Connor", "Ivan Giovanni di Federico"]),
    assignee: "Topcon Positioning Systems, Inc.",
    applicationNumber: "US14/802,389",
    filingDate: new Date("2015-07-17"),
    grantDate: new Date("2017-08-29"),
    legalStatus: "active",
    patentFamilySize: 4,
    summaryAbstract:
      "Pairs an agricultural drone with moving farm equipment (e.g., a boom sprayer) so the drone streams real-time crop data and verifies liquid application quality during the operation.",
    summaryClaims:
      "Claim 1 covers a method where a drone collects crop-specific information and communicates it to agricultural equipment that performs an in-flight operation based on that data while in motion relative to the drone.",
    summaryField:
      "Precision agriculture, variable-rate application, UAV-assisted farm equipment, and crop scouting services.",
    readinessScore: 68,
    claimBreadth: "medium",
    remainingLifeYears: 10.2,
    forwardCitations: 31,
    marketSizeProxy: "large",
    litigationHistory: "low",
  },
  {
    // Visa International — smartwatch contactless payment authentication
    patentNumber: "US10332111B2",
    jurisdiction: "US",
    title: "Authentication with smartwatch",
    abstract:
      "Embodiments of the disclosure are directed to performing a transaction between a smartwatch and an access device. Transaction details are transmitted by an antenna of a smartwatch to a contactless transaction module. An interface is rendered to a display of the smartwatch. An input of the interface is adjusted in response to a rotation of a crown of the smartwatch. The input is transmitted, by the antenna of the smartwatch, to a contactless transaction module in response to a confirmation of the input by a user of the smartwatch.",
    claims:
      "1. A smartwatch comprising: a housing; a display; a rotatable crown; a wireless antenna; a processor; and a computer-readable medium coupled to the processor, the computer-readable medium comprising code executable by the processor to: render a transaction interface on the display; receive, via the rotatable crown, an input adjustment to the transaction interface; receive a confirmation of a transaction input via the transaction interface; and transmit, by the wireless antenna, transaction data to a contactless transaction module of an access device in response to the confirmation.",
    description:
      "The disclosure relates generally to wearable devices and contactless payment systems, and more particularly to authenticating and confirming a payment transaction using a smartwatch with a rotatable crown as the primary input mechanism. Wearable payment devices must reconcile a small display with reliable user confirmation; the rotatable-crown interaction model addresses both accessibility and security.",
    fieldOfUse: "Consumer Electronics",
    inventors: JSON.stringify(["Gaurav Srikant Mokhasi", "Jerry Wald"]),
    assignee: "Visa International Service Association",
    applicationNumber: "US15/159,627",
    filingDate: new Date("2016-05-19"),
    grantDate: new Date("2019-06-25"),
    legalStatus: "active",
    patentFamilySize: 5,
    summaryAbstract:
      "Lets a smartwatch drive a contactless payment: a rotatable crown adjusts an on-watch transaction interface, and confirmation triggers antenna transmission to an access device.",
    summaryClaims:
      "Claim 1 covers a smartwatch with housing, display, rotatable crown, wireless antenna and processor that renders a transaction interface, receives crown-based adjustments, and on user confirmation transmits transaction data to a contactless transaction module.",
    summaryField:
      "Wearable payments, NFC/contactless POS, transit fare collection, and tokenized card programmes.",
    readinessScore: 80,
    claimBreadth: "medium",
    remainingLifeYears: 11.1,
    forwardCitations: 64,
    marketSizeProxy: "very-large",
    litigationHistory: "moderate",
  },
  {
    // Baidu USA — auto-labelling of low-end LIDAR data using high-end LIDAR (ADV)
    patentNumber: "US11592570B2",
    jurisdiction: "US",
    title: "Automated labeling system for autonomous driving vehicle lidar data",
    abstract:
      "A system and method for using high-end perception sensors such as high-end LIDARs to automatically label sensor data of low-end LIDARs of autonomous driving vehicles is disclosed. A perception system operating with a high-end LIDAR may process sensed data from the high-end LIDAR to detect objects and generate metadata of objects surrounding the vehicle. The confidence level of correctly identifying the objects using the high-end LIDAR may be further enhanced by fusing the data from the high-end LIDAR with data from other sensors such as cameras and radars. The method may use the detected objects and metadata generated based on the high-end LIDAR to label objects in data captured by the low-end LIDAR for training machine-learning models.",
    claims:
      "1. A computer-implemented method for labeling sensor data captured by an autonomous driving vehicles (ADV), the method comprising: receiving data captured by a reference light detection and range (LIDAR) sensor of the ADV; receiving data captured by a target LIDAR sensor of the ADV, wherein the target LIDAR sensor has a lower resolution than the reference LIDAR sensor; detecting one or more objects in the data captured by the reference LIDAR sensor; generating metadata describing the one or more objects; and labeling, based on the detected objects and the metadata, corresponding regions in the data captured by the target LIDAR sensor to produce labelled training data for a machine-learning perception model.",
    description:
      "The present disclosure relates generally to autonomous driving vehicles and, more particularly, to automated labelling of LIDAR sensor data. Training perception models requires large volumes of labelled data; manually labelling low-end LIDAR point clouds is expensive and slow. The present system uses a high-end LIDAR (sensor-fused with camera/radar) to auto-label data captured by the production low-end LIDAR, producing scalable training data.",
    fieldOfUse: "Automotive",
    inventors: JSON.stringify(["Fan Zhu"]),
    assignee: "Baidu USA LLC",
    applicationNumber: "US16/800,125",
    filingDate: new Date("2020-02-25"),
    grantDate: new Date("2023-02-28"),
    legalStatus: "active",
    patentFamilySize: 3,
    summaryAbstract:
      "Uses a high-end LIDAR (fused with camera/radar) on an ADV to auto-detect objects and label the corresponding regions in low-end LIDAR data, generating scalable training sets for perception models.",
    summaryClaims:
      "Claim 1 covers a method that receives data from a reference (high-resolution) LIDAR and a target (low-resolution) LIDAR, detects objects in the reference data, generates metadata, and labels corresponding regions in the target LIDAR data to produce ML training data.",
    summaryField:
      "Autonomous-vehicle perception stacks, robotaxi fleets, ADAS sensor-fusion, and synthetic-data pipelines.",
    readinessScore: 76,
    claimBreadth: "medium",
    remainingLifeYears: 14.9,
    forwardCitations: 22,
    marketSizeProxy: "very-large",
    litigationHistory: "low",
  },
  {
    // Lyten — lithium-sulfur cathode on few-layer graphene 3D structure
    patentNumber: "US10998552B2",
    jurisdiction: "US",
    title: "Lithium ion battery and battery materials",
    abstract:
      "In some embodiments, a lithium ion battery includes a first substrate, a cathode, a second substrate, an anode, and an electrolyte. The cathode is arranged on the first substrate and can contain a cathode mixture including LixSy, wherein x is from 0 to 2 and y is from 1 to 8, and a first particulate carbon. The anode is arranged on the second substrate and can contain an anode mixture containing silicon particles, and a second particulate carbon. The electrolyte can contain a solvent and a lithium salt and is arranged between the cathode and the anode. In some embodiments, the first particulate carbon is a three-dimensional carbon-based multi-modal structure formed from few layer graphene (FLG) sheets.",
    claims:
      "1. A lithium (Li) ion battery, comprising: a cathode formed of few layer graphene (FLG) sheets defining a three-dimensional (3D) carbon-based multi-modal structure comprising: a plurality of interconnected channels configured to provide ion transport; and a plurality of pores configured to host lithium-sulfur (LixSy) active material, wherein x is from 0 to 2 and y is from 1 to 8; an anode comprising silicon particles and a particulate carbon; and an electrolyte containing a solvent and a lithium salt arranged between the cathode and the anode.",
    description:
      "The disclosure relates generally to electrochemical energy storage and, more particularly, to lithium-ion battery architectures using a three-dimensional carbon-based multi-modal cathode structure formed from few-layer graphene sheets hosting lithium-sulfur active material. The 3D FLG scaffold provides interconnected ion-transport channels and pore volume for the active material, improving energy density and cycle life over conventional lithium-ion cells.",
    fieldOfUse: "Materials",
    inventors: JSON.stringify([
      "Bruce Lanning",
      "Michael W. Stowell",
      "Bryce H. Anzelmo",
      "George Clayton Gibbs",
      "Shreeyukta Singh",
      "Hossein-Ali Ghezelbash",
      "Prashanth Jampani Hanumantha",
      "Daniel Cook",
      "David Tanner",
    ]),
    assignee: "Lyten, Inc.",
    applicationNumber: "US16/928,972",
    filingDate: new Date("2020-07-14"),
    grantDate: new Date("2021-05-04"),
    legalStatus: "active",
    patentFamilySize: 6,
    summaryAbstract:
      "A lithium-ion cell whose cathode is a 3D multi-modal structure of few-layer graphene sheets hosting lithium-sulfur (LixSy) active material, paired with a silicon-containing anode.",
    summaryClaims:
      "Claim 1 covers the battery with a cathode of FLG sheets forming a 3D structure with ion-transport channels and pores hosting LixSy, a silicon-plus-carbon anode, and a lithium-salt electrolyte between them.",
    summaryField:
      "EV battery cells, aviation energy storage, grid-scale storage, and next-generation lithium-sulfur chemistries.",
    readinessScore: 72,
    claimBreadth: "broad",
    remainingLifeYears: 15.2,
    forwardCitations: 18,
    marketSizeProxy: "very-large",
    litigationHistory: "low",
  },
  {
    // Tesla — reduced-bit neural-network architecture for embedded devices (Iandola)
    patentNumber: "US11983630B2",
    jurisdiction: "US",
    title: "Neural networks for embedded devices",
    abstract:
      "A neural network architecture is used that reduces the processing load of implementing the neural network. This network architecture may thus be used for reduced-bit processing devices. The architecture may limit the number of bits used for processing and reduce processing to prevent data overflow at individual calculations of the neural network. To implement this architecture, the number of bits used to represent inputs at levels of the network and the related filter masks may also be modified to ensure the number of bits of the output does not overflow the resulting capacity of the reduced-bit processing devices.",
    claims:
      "1. A method of generating a neural network structure including one or more input layers each associated with one or more filters, the method comprising: determining, for an architecture of a device, a bit length of a set of registers of the device used to perform arithmetic operations; selecting a number of bits to represent inputs to a layer of the neural network based on the determined bit length; selecting a number of bits to represent filter masks of the layer based on the determined bit length; and configuring the layer so that an output of the layer does not overflow the bit length of the set of registers, thereby producing a reduced-bit neural network structure deployable on the device.",
    description:
      "The disclosure relates to neural-network architectures for resource-constrained embedded devices such as vehicle inference processors. Conventional neural networks use 32-bit floating-point arithmetic that exceeds the register capacity of low-power inference chips. The present architecture tunes bit lengths of inputs and filter masks per layer so that intermediate results never overflow the device's native register width, enabling on-device inference without retraining.",
    fieldOfUse: "AI/ML",
    inventors: JSON.stringify(["Forrest Nelson Iandola", "Harsimran Singh Sidhu", "Yiqi Hou"]),
    assignee: "Tesla, Inc.",
    applicationNumber: "US18/156,628",
    filingDate: new Date("2023-01-19"),
    grantDate: new Date("2024-05-14"),
    legalStatus: "active",
    patentFamilySize: 2,
    summaryAbstract:
      "Designs a neural-network architecture tuned to a device's native register width so per-layer inputs and filter masks never overflow, enabling on-device reduced-bit inference.",
    summaryClaims:
      "Claim 1 covers a method that determines the device's register bit length, selects input-bit and filter-mask-bit lengths based on it, and configures each layer so outputs fit the registers without overflow.",
    summaryField:
      "On-vehicle AI inference, edge ML chips, real-time perception for autonomous driving, and low-power robotics controllers.",
    readinessScore: 88,
    claimBreadth: "broad",
    remainingLifeYears: 17.7,
    forwardCitations: 9,
    marketSizeProxy: "very-large",
    litigationHistory: "none",
  },
];

async function main() {
  console.log("Seeding PatentSale…");

  // 1. Admin user (idempotent). Inlined here to avoid loading next-auth in tsx.
  const secret = process.env.ADMIN_MFA_SECRET || generateSecret();
  let admin = await db.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    admin = await db.adminUser.create({
      data: {
        email: ADMIN_EMAIL,
        name: "PatentSale Admin",
        passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10),
        mfaSecret: secret,
        // MFA disabled for now — login is email + password only. The TOTP
        // infrastructure (mfaSecret, otplib) remains so MFA can be re-enabled
        // by flipping this to true and re-adding the OTP field on the login page.
        mfaEnabled: false,
        role: "super_admin",
      },
    });
  } else {
    // Ensure existing admin has MFA disabled (idempotent on re-seed).
    if (admin.mfaEnabled) {
      admin = await db.adminUser.update({
        where: { id: admin.id },
        data: { mfaEnabled: false },
      });
    }
  }
  const currentOtp = await generate({ secret: admin.mfaSecret });
  console.log(`  admin ready: ${admin.email}`);
  console.log(`  admin password (dev): ${ADMIN_PASSWORD}`);
  console.log(`  admin MFA secret: ${admin.mfaSecret}`);
  console.log(`  current OTP (dev): ${currentOtp}`);

  // 2. REAL patents (idempotent via upsert on unique patentNumber+jurisdiction)
  //    First remove the original Task-1 DEMO patents (fake data) so the
  //    marketplace shows only authentic records. Listed by their demo numbers
  //    so this remains a safe, idempotent no-op on subsequent runs.
  const DEMO_PATENT_NUMBERS_TO_RETIRE = [
    "US11234567B2",
    "EP3876543B1",
    "IN3456789A1",
    "US10987654B1",
    "WO2021154321A1",
    "US11445566B2",
  ];
  for (const pn of DEMO_PATENT_NUMBERS_TO_RETIRE) {
    await db.patent.deleteMany({ where: { patentNumber: pn } });
  }
  console.log(`  retired ${DEMO_PATENT_NUMBERS_TO_RETIRE.length} demo patents (Task-1 fake data)`);

  // Assign stages + featured flags based on score (high score → market-ready,
  // mid → commercial/pilot, low → research/prototype). Mark top 4 as featured.
  const featuredPatents = new Set(REAL_PATENTS.slice(0, 4).map((p) => p.patentNumber));

  for (const p of REAL_PATENTS) {
    const score = p.readinessScore ?? 0;
    const stage = p.stage || (score >= 85 ? "market-ready" : score >= 70 ? "commercial" : score >= 55 ? "pilot" : "prototype");
    const featured = featuredPatents.has(p.patentNumber);
    await db.patent.upsert({
      where: { patentNumber_jurisdiction: { patentNumber: p.patentNumber, jurisdiction: p.jurisdiction } },
      update: {
        ...p,
        stage,
        featured,
        featuredAt: featured ? new Date() : null,
        filingDate: p.filingDate,
        grantDate: p.grantDate,
        dataSource: "admin-manual",
        recordLocked: false,
        published: true,
        publishedAt: p.grantDate,
        scoreSource: "manual",
      },
      create: {
        ...p,
        stage,
        featured,
        featuredAt: featured ? new Date() : null,
        filingDate: p.filingDate,
        grantDate: p.grantDate,
        dataSource: "admin-manual",
        recordLocked: false,
        published: true,
        publishedAt: p.grantDate,
        scoreSource: "manual",
      },
    });
  }
  console.log(`  ${REAL_PATENTS.length} real patents upserted (published=true)`);

  // 3. A sample lead for the admin leads dashboard
  const existingLead = await db.lead.findFirst({ where: { email: "priya.demo@example.com" } });
  if (!existingLead) {
    await db.lead.create({
      data: {
        name: "Priya Demo",
        email: "priya.demo@example.com",
        phone: "+91 98765 43210",
        patentNumber: "US10998877B1",
        status: "new",
        consent: true,
        ageConfirmed: true,
        consentTextSnapshot: "(seeded lead)",
      },
    });
    console.log("  sample lead created");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
