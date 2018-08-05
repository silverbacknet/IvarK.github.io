function getDilationMetaDimensionMultiplier () {
  return player.dilation.dilatedTime.div(1e40).pow(.1).plus(1);
}

function getMetaDimensionMultiplier (tier) {
  if (player.currentEternityChall === "eterc11") {
    return new Decimal(1);
  }
  let power = player.dilation.upgrades.includes("ngpp4") ? getDil15Bonus() : 2
  let multiplier = Decimal.pow(power, Math.floor(player.meta[tier].bought / 10)).times(Decimal.pow(power*(player.achievements.includes("ngpp14")?1.01:1), Math.max(0, player.meta.resets - tier + 1))).times(getDilationMetaDimensionMultiplier());
  if (player.dilation.upgrades.includes("ngpp13")) {
    multiplier = multiplier.times(getDil14Bonus());
  }
  if (player.achievements.includes("ngpp12")) multiplier = multiplier.times(1.1)
  if (player.masterystudies) if (player.masterystudies.includes("t262")) multiplier = multiplier.times(getTS262Mult())
  
  if (multiplier.lt(1)) multiplier = new Decimal(1)
  if (player.dilation.active || player.aarexModifications.newGameMinusMinusVersion) {
    multiplier = Decimal.pow(10, Math.pow(multiplier.log10(), 0.75))
    if (player.dilation.upgrades.includes(11)) {
      multiplier = Decimal.pow(10, Math.pow(multiplier.log10(), 1.05))
    }
  }

  return multiplier;
}

function getMetaDimensionDescription(tier) {
  if (tier > Math.min(7, player.meta.resets + 3)) return getFullExpansion(player.meta[tier].bought) + ' (' + dimMetaBought(tier) + ')';
  else return shortenDimensions(player.meta[tier].amount) + ' (' + dimMetaBought(tier) + ')  (+' + formatValue(player.options.notation, getMetaDimensionRateOfChange(tier), 2, 2) + '%/s)';
}

function getMetaDimensionRateOfChange(tier) {
  let toGain = getMetaDimensionProduction(tier + 1);

  var current = player.meta[tier].amount.max(1);
  var change  = toGain.times(10).dividedBy(current);

  return change;
}

function canBuyMetaDimension(tier) {
    if (tier > player.meta.resets + 4) return false;
    if (tier > 1 && player.meta[tier - 1].amount.eq(0)) return false;
    return true;
}

function clearMetaDimensions () {
    for (i = 1; i <= 8; i++) {
        player.meta[i].amount = new Decimal(0);
        player.meta[i].bought = 0;
        player.meta[i].cost = new Decimal(initCost[i]);
    }
}

function getMetaShiftRequirement () {
  return {
    tier: Math.min(8, player.meta.resets + 4),
    amount: Math.max(20, -40 + 15 * player.meta.resets) + Math.max(5 * player.meta.resets - 75, 0)
  }
}

function metaBoost() {
    let req = getMetaShiftRequirement();
    if (player.meta[req.tier].bought<req.amount) {
        return false;
    }
    player.meta.resets++;
    if (player.meta.resets>9) giveAchievement("Meta-boosting to the max")
    player.meta.antimatter = new Decimal(player.achievements.includes("ngpp12")?100:10);
    clearMetaDimensions();
    for (let i = 2; i <= 8; i++) {
      document.getElementById(i + "MetaRow").style.display = "none"
    }
    return true;
}


function getMetaDimensionCostMultiplier(tier) {
    return costMults[tier];
}

function dimMetaBought(tier) {
	return player.meta[tier].bought % 10;
}

function metaBuyOneDimension(tier) {
    var cost = player.meta[tier].cost;
    if (!canBuyMetaDimension(tier)) {
        return false;
    }
    if (!canAffordMetaDimension(cost)) {
        return false;
    }
    player.meta.antimatter = player.meta.antimatter.minus(cost);
    player.meta[tier].amount = player.meta[tier].amount.plus(1);
    player.meta[tier].bought++;
    if (player.meta[tier].bought % 10 < 1) {
        player.meta[tier].cost = player.meta[tier].cost.times(getMetaDimensionCostMultiplier(tier));
    }
    if (tier>7) giveAchievement("And still no ninth dimension...")
    return true;
}

function getMetaMaxCost(tier) {
  return player.meta[tier].cost.times(10 - dimMetaBought(tier));
}

function metaBuyManyDimension(tier) {
    var cost = getMetaMaxCost(tier);
    if (!canBuyMetaDimension(tier)) {
        return false;
    }
    if (!canAffordMetaDimension(cost)) {
        return false;
    }
    player.meta.antimatter = player.meta.antimatter.minus(cost);
    player.meta[tier].amount = player.meta[tier].amount.plus(10 - dimMetaBought(tier));
    player.meta[tier].cost = player.meta[tier].cost.times(getMetaDimensionCostMultiplier(tier));
    player.meta[tier].bought += 10 - dimMetaBought(tier)
    if (tier>7) giveAchievement("And still no ninth dimension...")
    return true;
}

function canAffordMetaDimension(cost) {
    return cost.lte(player.meta.antimatter);
}

for (let i = 1; i <= 8; i++) {
    document.getElementById("meta" + i).onclick = function () {
        metaBuyOneDimension(i);
    }
    document.getElementById("metaMax" + i).onclick = function () {
        metaBuyManyDimension(i);
    }
}

document.getElementById("metaMaxAll").onclick = function () {
    for (let i = 1; i <= 8; i++) {
      while (metaBuyManyDimension(i)) {};
    }
}

document.getElementById("metaSoftReset").onclick = function () {
    metaBoost();
}

function getMetaDimensionProduction(tier) {
    return Decimal.floor(player.meta[tier].amount).times(getMetaDimensionMultiplier(tier));
}

function getExtraDimensionBoostPower() {
	return player.currentEternityChall=="eterc14" ? new Decimal(1) : player.meta.bestAntimatter.pow(!player.dilation.upgrades.includes("ngpp5") ? 8 : 9+ECTimesCompleted("eterc13")*0.2).plus(1)
}

function getDil14Bonus () {
	return 1 + Math.log10(1 - Math.min(0, player.tickspeed.log(10)));
}

function getDil17Bonus () {
	return Math.sqrt(player.meta.bestAntimatter.log10());
}

function updateMetaDimensions () {
	document.getElementById("metaAntimatterAmount").textContent = shortenMoney(player.meta.antimatter);
	document.getElementById("metaAntimatterBest").textContent = shortenMoney(player.meta.bestAntimatter);
	document.getElementById("metaAntimatterEffect").textContent = shortenMoney(getExtraDimensionBoostPower())
	document.getElementById("metaAntimatterPerSec").textContent = 'You are getting ' + shortenDimensions(getMetaDimensionProduction(1)) + ' meta-antimatter per second.';
	for (let tier = 1; tier <= 8; ++tier) {
		if (!canBuyMetaDimension(tier) && document.getElementById(tier + "MetaRow").style.display !== "table-row") {
			break;
		}
		document.getElementById(tier + "MetaD").childNodes[0].nodeValue = DISPLAY_NAMES[tier] + " Meta Dimension x" + formatValue(player.options.notation, getMetaDimensionMultiplier(tier), 1, 1);
		document.getElementById("meta" + tier + "Amount").textContent = getMetaDimensionDescription(tier);
	}
	for (let tier = 1; tier <= 8; ++tier) {
		if (!canBuyMetaDimension(tier)) {
			break;
		}
		document.getElementById(tier + "MetaRow").style.display = "table-row";
		document.getElementById(tier + "MetaRow").style.visibility = "visible";
	}
	for (let tier = 1; tier <= 8; ++tier) {
		document.getElementById('meta' + tier).className = canAffordMetaDimension(player.meta[tier].cost) ? 'storebtn' : 'unavailablebtn';
		document.getElementById('metaMax' + tier).className = canAffordMetaDimension(getMetaMaxCost(tier)) ? 'storebtn' : 'unavailablebtn';
	}
	var isMetaShift = player.meta.resets < 4
	var metaShiftRequirement = getMetaShiftRequirement()
        document.getElementById("metaResetLabel").textContent = 'Meta-Dimension ' + (isMetaShift ? "Shift" : "Boost") + ' ('+ getFullExpansion(player.meta.resets) +'): requires ' + getFullExpansion(metaShiftRequirement.amount) + " " + DISPLAY_NAMES[metaShiftRequirement.tier] + " Meta Dimensions"
        document.getElementById("metaSoftReset").textContent = "Reset meta-dimensions for " + (isMetaShift ? "a new dimension" : "the boost")
	if (player.meta[metaShiftRequirement.tier].bought >= metaShiftRequirement.amount) {
		document.getElementById("metaSoftReset").className = 'storebtn';
	} else {
		document.getElementById("metaSoftReset").className = 'unavailablebtn';
	}
    var QS = quarkGain()
    var req = Decimal.pow(Number.MAX_VALUE,player.masterystudies?1.5:1)
    document.getElementById("quantumResetLabel").textContent = 'Quantum: requires '+shorten(req)+' meta-antimatter'
    document.getElementById("quantum").textContent = 'Lose all your previous progress, but '+(player.quantum.times<1||player.meta.antimatter.lt(req)?'get a boost':'gain '+shortenDimensions(QS)+' quark'+(QS.lt(2)?'':'s')+' for boosts')
	document.getElementById("quantum").className = player.meta.antimatter.lt(req) ? 'unavailablebtn' : 'storebtn'
}

// v2.2
function updateAutoEterMode() {
	if (player.autoEterMode == "time") {
		document.getElementById("toggleautoetermode").textContent = "Auto eternity mode: time"
		document.getElementById("eterlimittext").textContent = "Seconds between eternities:"
	} else if (player.autoEterMode == "relative") {
		document.getElementById("toggleautoetermode").textContent = "Auto eternity mode: X times last eternity"
		document.getElementById("eterlimittext").textContent = "X times last eternity:"
	} else if (player.autoEterMode == "relativebest") {
		document.getElementById("toggleautoetermode").textContent = "Auto eternity mode: X times best of last 10"
        document.getElementById("eterlimittext").textContent = "X times best of last 10 eternities:"
	} else if (player.autoEterMode == "replicanti") {
		document.getElementById("toggleautoetermode").textContent = "Auto eternity mode: replicanti"
		document.getElementById("eterlimittext").textContent = "Amount of replicanti to wait until reset:"
	} else if (player.autoEterMode == "peak") {
		document.getElementById("toggleautoetermode").textContent = "Auto eternity mode: peak"
		document.getElementById("eterlimittext").textContent = "Seconds to wait after latest peak gain:"
	} else {
		document.getElementById("toggleautoetermode").textContent = "Auto eternity mode: amount"
		document.getElementById("eterlimittext").textContent = "Amount of EP to wait until reset:"
	}
}

function toggleAutoEterMode() {
	if (player.autoEterMode == "amount") player.autoEterMode = "time"
	else if (player.autoEterMode == "time") player.autoEterMode = "relative"
	else if (player.autoEterMode == "relative") player.autoEterMode = "relativebest"
	else if (player.autoEterMode == "relativebest" && player.dilation.upgrades.includes("ngpp3") && player.eternities >= 4e11 && player.aarexModifications.newGame3PlusVersion) player.autoEterMode = "replicanti"
	else if (player.autoEterMode == "replicanti" && player.eternities >= 1e13) player.autoEterMode = "peak"
	else if (player.autoEterMode) player.autoEterMode = "amount"
	updateAutoEterMode()
}

// v2.21
function getDil15Bonus () {
	return Math.log10(player.dilation.dilatedTime.max(1e10).min(1e100).log(10)) + 1;
}

// v2.3
function toggleAllTimeDims() {
	var turnOn
	var id=1
	while (id<9&&turnOn===undefined) {
		if (!player.autoEterOptions["td"+id]) turnOn=true
		else if (id>7) turnOn=false
		id++
	}
	for (id=1;id<9;id++) {
		player.autoEterOptions["td"+id]=turnOn
		document.getElementById("td"+id+'auto').textContent="Auto: O"+(turnOn?"N":"FF")
	}
}

function toggleAutoEter(id) {
	player.autoEterOptions[id]=!player.autoEterOptions[id]
	document.getElementById(id+'auto').textContent="Auto: O"+(player.autoEterOptions[id]?"N":"FF")
}

function doAutoEterTick() {
	if (player.achievements.includes("ngpp17")) {
		for (d=1;d<9;d++) if (player.autoEterOptions["td"+d]) buyMaxTimeDimension(d)
		if (player.autoEterOptions.epmult) buyMaxEPMult()
	}
}

// v2.301
function replicantiGalaxyBulkModeToggle() {
	player.galaxyMaxBulk=!player.galaxyMaxBulk
	document.getElementById('replicantibulkmodetoggle').textContent="Mode: "+(player.galaxyMaxBulk?"Max":"Singles")
}

// v2.9
quantumed = false
function quantum() {
	if (player.meta.antimatter.lt(Number.MAX_VALUE)||implosionCheck) return
	var headstart = player.aarexModifications.newGamePlusVersion > 0 && !player.masterystudies
	if (player.aarexModifications.quantumConf) if (!confirm("Quantum will reset everything eternity resets, and "+(headstart?"also some other things like dilation":"also time studies, eternity challenges, dilation, "+(player.masterystudies?"meta dimensions, and mastery studies":"and meta dimensions"))+". You will gain a quark and unlock various upgrades.")) return
	if (player.quantum.times<1) if (!confirm("Are you sure you want to do that? You will lose everything you have! "+(player.masterystudies?"":"This is work on progress!"))) return
	implosionCheck=1
	dev.implode()
	setTimeout(function(){
		implosionCheck=0
	},2000)
	setTimeout(function(){
		showDimTab("antimatterdimensions")
		showChallengesTab("challenges")
		showInfTab("preinf")
		showEternityTab("timestudies")
		if (document.getElementById("quantumtab").style.display=="none") showTab("dimensions")
		else document.getElementById("TTbuttons").style.display="none"
		if (!quantumed) {
			quantumed=true
			document.getElementById("quantumtabbtn").style.display=""
			document.getElementById("quarks").style.display=""
		}
		document.getElementById("quantumbtn").style.display="none"
        for (var i=player.quantum.last10.length-1; i>0; i--) {
            player.quantum.last10[i] = player.quantum.last10[i-1]
        }
        player.quantum.last10[0] = [player.quantum.time, quarkGain()]
		player.quantum.best=Math.min(player.quantum.best, player.quantum.time)
		player.quantum.time=0
		player.quantum.times++
		player.quantum.quarks = player.quantum.quarks.plus(quarkGain());
		document.getElementById("quarks").innerHTML="You have <b id='QK'>"+shortenDimensions(player.quantum.quarks)+"</b> quark"+(player.quantum.quarks.lt(2)?".":"s.")
		if (player.masterystudies) {
			if (!player.quantum.gluons.rg) {
				player.quantum.gluons = {
					rg: new Decimal(0),
					gb: new Decimal(0),
					br: new Decimal(0)
				}
			}
		} else player.quantum.gluons = 0;
		player = {
			money: new Decimal(10),
			tickSpeedCost: new Decimal(1000),
			tickspeed: new Decimal(1000),
			firstCost: new Decimal(10),
			secondCost: new Decimal(100),
			thirdCost: new Decimal(10000),
			fourthCost: new Decimal(1000000),
			fifthCost: new Decimal(1e9),
			sixthCost: new Decimal(1e13),
			seventhCost: new Decimal(1e18),
			eightCost: new Decimal(1e24),
			firstAmount: new Decimal(0),
			secondAmount: new Decimal(0),
			thirdAmount: new Decimal(0),
			fourthAmount: new Decimal(0),
			firstBought: 0,
			secondBought: 0,
			thirdBought: 0,
			fourthBought: 0,
			fifthAmount: new Decimal(0),
			sixthAmount: new Decimal(0),
			seventhAmount: new Decimal(0),
			eightAmount: new Decimal(0),
			fifthBought: 0,
			sixthBought: 0,
			seventhBought: 0,
			eightBought: 0,
			firstPow: new Decimal(1),
			secondPow: new Decimal(1),
			thirdPow: new Decimal(1),
			fourthPow: new Decimal(1),
			fifthPow: new Decimal(1),
			sixthPow: new Decimal(1),
			seventhPow: new Decimal(1),
			eightPow: new Decimal(1),
			sacrificed: new Decimal(0),
			achievements: player.achievements,
			challenges: headstart ? player.challenges : player.achievements.includes("r133") ? ["postc1", "postc2", "postc3", "postc4", "postc5", "postc6", "postc7", "postc8"] : [],
			currentChallenge: "",
			infinityUpgrades: headstart ? player.infinityUpgrades : [],
			infinityPoints: new Decimal(0),
			infinitied: 0,
			infinitiedBank: headstart ? player.infinitiedBank : 0,
			totalTimePlayed: player.totalTimePlayed,
			bestInfinityTime: 9999999999,
			thisInfinityTime: 0,
			resets: headstart ? 4 : 0,
			dbPower: player.dbPower ? new Decimal(1) : undefined,
			galaxies: headstart ? 1 : 0,
			galacticSacrifice: resetGalacticSacrifice(),
			tickDecrease: 0.9,
			totalmoney: player.totalmoney,
			interval: null,
			lastUpdate: player.lastUpdate,
			achPow: player.achPow,
			autobuyers: headstart ? player.autobuyers : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
			partInfinityPoint: 0,
			partInfinitied: 0,
			break: headstart ? player.break : false,
			costMultipliers: [new Decimal(1e3), new Decimal(1e4), new Decimal(1e5), new Decimal(1e6), new Decimal(1e8), new Decimal(1e10), new Decimal(1e12), new Decimal(1e15)],
			tickspeedMultiplier: new Decimal(10),
			chall2Pow: 1,
			chall3Pow: new Decimal(0.01),
			newsArray: player.newsArray,
			matter: new Decimal(0),
			chall11Pow: new Decimal(1),
			challengeTimes: player.challengeTimes,
			infchallengeTimes: player.infchallengeTimes,
			lastTenRuns: [[600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)]],
			lastTenEternities: [[600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)], [600*60*24*31, new Decimal(0)]],
			infMult: new Decimal(1),
			infMultCost: new Decimal(10),
			tickSpeedMultDecrease: headstart ? player.tickSpeedMultDecrease : 10,
			tickSpeedMultDecreaseCost: headstart ? player.tickSpeedMultDecreaseCost : 3e6,
			dimensionMultDecrease: headstart ? player.dimensionMultDecrease : 10,
			dimensionMultDecreaseCost: headstart ? player.dimensionMultDecreaseCost : 1e8,
			version: player.version,
			postChallUnlocked: (player.achievements.includes("r133")) ? 8 : 0,
			postC4Tier: 1,
			postC3Reward: new Decimal(1),
			overXGalaxies: headstart ? player.overXGalaxies : 0,
			spreadingCancer: player.spreadingCancer,
			postChallUnlocked: 0,
			postC4Tier: 0,
			postC3Reward: new Decimal(1),
			eternityPoints: new Decimal(0),
			eternities: headstart ? player.eternities : 0,
			thisEternity: 0,
			bestEternity: headstart ? player.bestEternity : 9999999999,
			eternityUpgrades: [],
			epmult: new Decimal(1),
			epmultCost: new Decimal(500),
			infDimensionsUnlocked: [false, false, false, false, false, false, false, false],
			infinityPower: new Decimal(1),
			infinityDimension1 : {
				cost: new Decimal(1e8),
				amount: new Decimal(0),
				bought: 0,
				power: new Decimal(1),
				baseAmount: 0
			},
			infinityDimension2 : {
				cost: new Decimal(1e9),
				amount: new Decimal(0),
				bought: 0,
				power: new Decimal(1),
				baseAmount: 0
			},
			infinityDimension3 : {
				cost: new Decimal(1e10),
				amount: new Decimal(0),
				bought: 0,
				power: new Decimal(1),
				baseAmount: 0
			},
			infinityDimension4 : {
				cost: new Decimal(1e20),
				amount: new Decimal(0),
				bought: 0,
				power: new Decimal(1),
				baseAmount: 0
			},
			infinityDimension5 : {
				cost: new Decimal(1e140),
				amount: new Decimal(0),
				bought: 0,
				power: new Decimal(1),
				baseAmount: 0
			},
			infinityDimension6 : {
				cost: new Decimal(1e200),
				amount: new Decimal(0),
				bought: 0,
				power: new Decimal(1),
				baseAmount: 0
			},
			infinityDimension7 : {
				cost: new Decimal(1e250),
				amount: new Decimal(0),
				bought: 0,
				power: new Decimal(1),
				baseAmount: 0
			},
			infinityDimension8 : {
				cost: new Decimal(1e280),
				amount: new Decimal(0),
				bought: 0,
				power: new Decimal(1),
				baseAmount: 0
			},
			infDimBuyers: headstart ? player.infDimBuyers : [false, false, false, false, false, false, false, false],
			timeShards: new Decimal(0),
			tickThreshold: new Decimal(1),
			totalTickGained: 0,
			timeDimension1: {
				cost: new Decimal(1),
				amount: new Decimal(0),
				power: new Decimal(1),
				bought: 0
			},
			timeDimension2: {
				cost: new Decimal(5),
				amount: new Decimal(0),
				power: new Decimal(1),
				bought: 0
			},
			timeDimension3: {
				cost: new Decimal(100),
				amount: new Decimal(0),
				power: new Decimal(1),
				bought: 0
			},
			timeDimension4: {
				cost: new Decimal(1000),
				amount: new Decimal(0),
				power: new Decimal(1),
				bought: 0
			},
			timeDimension5: {
				cost: new Decimal("1e2350"),
				amount: new Decimal(0),
				power: new Decimal(1),
				bought: 0
			},
			timeDimension6: {
				cost: new Decimal("1e2650"),
				amount: new Decimal(0),
				power: new Decimal(1),
				bought: 0
			},
			timeDimension7: {
				cost: new Decimal("1e3000"),
				amount: new Decimal(0),
				power: new Decimal(1),
				bought: 0
			},
			timeDimension8: {
				cost: new Decimal("1e3350"),
				amount: new Decimal(0),
				power: new Decimal(1),
				bought: 0
			},
			offlineProd: headstart ? player.offlineProd : 0,
			offlineProdCost: headstart ? player.offlineProdCost : 1e7,
			challengeTarget: 0,
			autoSacrifice: headstart ? player.autoSacrifice : 1,
			replicanti: {
				amount: new Decimal(0),
				unl: headstart ? player.replicanti.unl : false,
				chance: 0.01,
				chanceCost: new Decimal(1e150),
				interval: 1000,
				intervalCost: new Decimal(1e140),
				gal: 0,
				galaxies: 0,
				galCost: new Decimal(1e170),
				galaxybuyer: headstart ? player.replicanti.galaxybuyer : undefined,
				auto: headstart ? player.replicanti.auto : [false, false, false]
			},
			timestudy: {
				theorem: 0,
				amcost: new Decimal("1e20000"),
				ipcost: new Decimal(1),
				epcost: new Decimal(1),
				studies: [],
			},
			eternityChalls: {},
			eternityChallGoal: new Decimal(Number.MAX_VALUE),
			currentEternityChall: "",
			eternityChallUnlocked: 0,
			etercreq: 0,
			autoIP: new Decimal(0),
			autoTime: 1e300,
			infMultBuyer: headstart ? player.infMultBuyer : false,
			autoCrunchMode: headstart ? player.autoCrunchMode : "amount",
			respec: false,
			eternityBuyer: headstart ? player.eternityBuyer : {
				limit: new Decimal(0),
				isOn: false
			},
			eterc8ids: 50,
			eterc8repl: 40,
			dimlife: true,
			dead: true,
			dilation: {
				studies: [],
				active: false,
				tachyonParticles: new Decimal(0),
				dilatedTime: new Decimal(0),
				totalTachyonParticles: new Decimal(0),
				nextThreshold: new Decimal(1000),
				freeGalaxies: 0,
				upgrades: [],
				rebuyables: {
					1: 0,
					2: 0,
					3: 0,
					4: 0,
				}
			},
			why: player.why,
			options: player.options,
			meta: {
				antimatter: new Decimal(10),
				bestAntimatter: headstart ? player.meta.bestAntimatter : new Decimal(10),
				resets: 0,
				'1': {
					amount: new Decimal(0),
					bought: 0,
					tensBought: 0,
					cost: new Decimal(10)
				},
				'2': {
					amount: new Decimal(0),
					bought: 0,
					tensBought: 0,
					cost: new Decimal(100)
				},
				'3': {
					amount: new Decimal(0),
					bought: 0,
					tensBought: 0,
					cost: new Decimal(1e4)
				},
				'4': {
					amount: new Decimal(0),
					bought: 0,
					tensBought: 0,
					cost: new Decimal(1e6)
				},
				'5': {
					amount: new Decimal(0),
					bought: 0,
					tensBought: 0,
					cost: new Decimal(1e9)
				},
				'6': {
					amount: new Decimal(0),
					bought: 0,
					tensBought: 0,
					cost: new Decimal(1e13)
				},
				'7': {
					amount: new Decimal(0),
					bought: 0,
					tensBought: 0,
					cost: new Decimal(1e18)
				},
				'8': {
					amount: new Decimal(0),
					bought: 0,
					tensBought: 0,
					cost: new Decimal(1e24)
				}
			},
			masterystudies: player.masterystudies ? [] : undefined,
			autoEterOptions: player.autoEterOptions,
			galaxyMaxBulk: player.galaxyMaxBulk,
			quantum: player.quantum,
			aarexModifications: player.aarexModifications
		};
		if (headstart) for (ec=1;ec<13;ec++) player.eternityChalls['eterc'+ec]=5
		if (player.masterystudies) {
			var diffrg=player.quantum.usedQuarks.r.min(player.quantum.usedQuarks.g)
			var diffgb=player.quantum.usedQuarks.g.min(player.quantum.usedQuarks.b)
			var diffbr=player.quantum.usedQuarks.b.min(player.quantum.usedQuarks.r)
			player.quantum.usedQuarks.r=player.quantum.usedQuarks.r.sub(diffrg)
			player.quantum.usedQuarks.g=player.quantum.usedQuarks.g.sub(diffgb)
			player.quantum.usedQuarks.b=player.quantum.usedQuarks.b.sub(diffbr)
			player.quantum.gluons.rg=player.quantum.gluons.rg.add(diffrg)
			player.quantum.gluons.gb=player.quantum.gluons.gb.add(diffgb)
			player.quantum.gluons.br=player.quantum.gluons.br.add(diffbr)
		}
		
		setInitialDimensionPower()
		updatePowers()
		if (player.replicanti.unl) player.replicanti.amount = new Decimal(1)
		player.replicanti.galaxies = 0
		ipMultPower=2
		document.getElementById("respec").className = "storebtn"
		if (player.achievements.includes("r36")) player.tickspeed = player.tickspeed.times(0.98);
		if (player.achievements.includes("r45")) player.tickspeed = player.tickspeed.times(0.98);
		document.getElementById("matter").style.display = "none";
		document.getElementById("quickReset").style.display = "none";
		if (player.infinitied >= 1 && !player.challenges.includes("challenge1")) player.challenges.push("challenge1");
		updateAutobuyers();
		if (player.achievements.includes("r37")) player.money = new Decimal(1000);
		if (player.achievements.includes("r54")) player.money = new Decimal(2e5);
		if (player.achievements.includes("r55")) player.money = new Decimal(1e10);
		if (player.achievements.includes("r78")) player.money = new Decimal(1e25);
		if (player.achievements.includes("r85")) player.infMult = player.infMult.times(4);
		if (player.achievements.includes("r93")) player.infMult = player.infMult.times(4);
		if (player.achievements.includes("r104")) player.infinityPoints = new Decimal(2e25);
		if (player.achievements.includes("r142")) player.meta.antimatter = new Decimal(100);
		resetInfDimensions();
		updateChallenges();
		updateChallengeTimes()
		updateLastTenRuns()
		updateLastTenEternities()
		updateLastTenQuantums()
		if (!player.achievements.includes("r133")) {
			var infchalls = Array.from(document.getElementsByClassName('infchallengediv'))
			for (var i = 0; i< infchalls.length; i++) infchalls[i].style.display = "none"
		}
		IPminpeak = new Decimal(0)
		EPminpeak = new Decimal(0)
		updateAutobuyers()
		updateMilestones()
		resetTimeDimensions()
		document.getElementById("secondRow").style.display = "none";
		document.getElementById("thirdRow").style.display = "none";
		document.getElementById("tickSpeed").style.visibility = "hidden";
		document.getElementById("tickSpeedMax").style.visibility = "hidden";
		document.getElementById("tickLabel").style.visibility = "hidden";
		document.getElementById("tickSpeedAmount").style.visibility = "hidden";
		document.getElementById("fourthRow").style.display = "none";
		document.getElementById("fifthRow").style.display = "none";
		document.getElementById("sixthRow").style.display = "none";
		document.getElementById("seventhRow").style.display = "none";
		document.getElementById("eightRow").style.display = "none";
		if (!player.replicanti.unl) {
			document.getElementById("replicantidiv").style.display="none"
			document.getElementById("replicantiunlock").style.display="inline-block"
		}
		document.getElementById("break").textContent = "BREAK INFINITY"
		document.getElementById("abletobreak").style.display = "block"
		if (!headstart) {
			document.getElementById("replicantiresettoggle").style.display = "inline-block"
			delete player.replicanti.galaxybuyer
		} else document.getElementById("replicantiresettoggle").style.display = "none"
		document.getElementById("infinityPoints1").innerHTML = "You have <span class=\"IPAmount1\">"+shortenDimensions(player.infinityPoints)+"</span> Infinity points."
		document.getElementById("infinityPoints2").innerHTML = "You have <span class=\"IPAmount2\">"+shortenDimensions(player.infinityPoints)+"</span> Infinity points."
		document.getElementById("replicantireset").innerHTML = "Reset replicanti amount, but get a free galaxy<br>"+player.replicanti.galaxies + " replicated galaxies created."
		document.getElementById("eternitybtn").style.display = player.infinityPoints.gte(player.eternityChallGoal) ? "inline-block" : "none"
		document.getElementById("eternityPoints2").style.display = "inline-block"
		document.getElementById("eternitystorebtn").style.display = "inline-block"
		document.getElementById("infiMult").innerHTML = "Multiply infinity points from all sources by 2 <br>currently: "+shorten(player.infMult.times(kongIPMult)) +"x<br>Cost: "+shortenCosts(player.infMultCost)+" IP"
		updateEternityUpgrades()
		document.getElementById("totaltickgained").textContent = "You've gained "+player.totalTickGained.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+" tickspeed upgrades."
		updateTickSpeed();
		playerInfinityUpgradesOnEternity()
		document.getElementById("eternityPoints2").innerHTML = "You have <span class=\"EPAmount2\">"+shortenDimensions(player.eternityPoints)+"</span> Eternity point"+((player.eternityPoints.eq(1)) ? "." : "s.")
		updateEternityChallenges()
		updateTheoremButtons()
		updateTimeStudyButtons()
		drawStudyTree()
		document.getElementById("masterystudyunlock").style.display = "none";
		updateMasteryStudyCosts()
		updateMasteryStudyButtons()
		drawMasteryTree()
		updateColorCharge()
		Marathon2 = 0;
		document.getElementById("quantumConfirmBtn").style.display = "inline-block"
	},1000)
}
let quarkGain = function () {
	if (player.masterystudies) return Decimal.pow(10, player.meta.antimatter.log10() / 308 - 1.3).times(quarkMult()).floor()
	return Decimal.pow(10, player.meta.antimatter.log(10) / Math.log10(Number.MAX_VALUE) - 1).times(quarkMult()).floor();
}

let quarkMult = function () {
	let ret = Decimal.pow(2, player.quantum.rebuyables[2]);
	if (player.quantum.upgrades.includes(4)) {
		ret = ret.times(Decimal.pow(2, player.quantum.realGluons / 1024));
	}
	return ret;
}

function toggleQuantumConf() {
    player.aarexModifications.quantumConf = !player.aarexModifications.quantumConf
    document.getElementById("quantumConfirmBtn").textContent = "Quantum confirmation: O" + (player.aarexModifications.quantumConf ? "N" : "FF")
}

var averageQk = new Decimal(0)
var bestQk
function updateLastTenQuantums() {
	if (player.meta == undefined) return
    var listed = 0
    var tempTime = new Decimal(0)
    var tempQK = new Decimal(0)
    for (var i=0; i<10; i++) {
        if (player.quantum.last10[i][1].gt(0)) {
            var qkpm = player.quantum.last10[i][1].dividedBy(player.quantum.last10[i][0]/600)
            var tempstring = shorten(qkpm) + " QK/min"
            if (qkpm<1) tempstring = shorten(qkpm*60) + " QK/hour"
            document.getElementById("quantumrun"+(i+1)).textContent = "The quantum " + (i == 0 ? '1 quantum' : (i+1) + ' quantums') + " ago took " + timeDisplayShort(player.quantum.last10[i][0]) + " and gave " + shortenDimensions(player.quantum.last10[i][1]) +" QK. "+ tempstring
            tempTime = tempTime.plus(player.quantum.last10[i][0])
            tempQK = tempQK.plus(player.quantum.last10[i][1])
            bestQk = player.quantum.last10[i][1].max(bestQk)
            listed++
        } else document.getElementById("quantumrun"+(i+1)).textContent = ""
    }
    if (listed > 1) {
        tempTime = tempTime.dividedBy(listed)
        tempQK = tempQK.dividedBy(listed)
        var qkpm = tempQK.dividedBy(tempTime/600)
        var tempstring = shorten(qkpm) + " QK/min"
        averageQk = tempQK
        if (qkpm<1) tempstring = shorten(qkpm*60) + "QK/hour"
        document.getElementById("averageQuantumRun").textContent = "Last " + listed + " quantums average time: "+ timeDisplayShort(tempTime)+" Average QK gain: "+shortenDimensions(tempQK)+" QK. "+tempstring
    } else document.getElementById("averageQuantumRun").textContent = ""
}