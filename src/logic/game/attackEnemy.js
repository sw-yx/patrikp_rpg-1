
import randomGenerator from "../randomGenerator"
import gameHandler from "../game/gameHandler"

import mainData from "../../data/_mainData"

export default function attackEnemy(props, typeOfAttack, strengthOfAttack) {

    // set damage based on typeOfAttack (melee or ranged)
    const typeOfAtt = () => {
      switch (typeOfAttack) {
        case "melee": return { 
          dmg: props.player.meleeDamage, 
          dodge: props.enemy.meleeDodgeChance, 
          armor: props.enemy.meleeArmor 
        };
        case "ranged": return { 
          dmg: props.player.rangedDamage, 
          dodge: props.enemy.rangedDodgeChance, 
          armor: props.enemy.rangedArmor 
        };
        default: break;
      }
    }

    // set multiplier based on strengthOfAttack
    const typeMultiplier = () => {
      let dmg
      switch (strengthOfAttack) {
        case "light": dmg = mainData.playerBase.attackTypes.damage.light; return {
          dmg: randomGenerator(dmg.min, dmg.max, dmg.perc),
          hitChance: mainData.playerBase.attackTypes.hitChance.light
        }
        case "medium": dmg = mainData.playerBase.attackTypes.damage.medium; return {
          dmg: randomGenerator(dmg.min, dmg.max, dmg.perc),
          hitChance: mainData.playerBase.attackTypes.hitChance.medium
        }
        case "strong": dmg = mainData.playerBase.attackTypes.damage.strong; return {
          dmg: randomGenerator(dmg.min, dmg.max, dmg.perc),
          hitChance: mainData.playerBase.attackTypes.hitChance.strong
        }
        default: break;
      }
    }

    // bonus multiplier
    const bonusMultiplier = () => {
      const specie = props.enemy.currentEnemy.specie
      const playerBonuses = props.player.bonuses
      let bonusValue = 1

      playerBonuses.forEach(bonus => {
        if(bonus.name === specie) {
          bonusValue = 1 + bonus.value * 0.01
        }
      })
      return bonusValue
    }

    // crit
    const critFc = () => {
      const critMultiplier = mainData.playerBase.critMult
      const critChance = props.player.critChance
      const random = randomGenerator(0, 100, 1)

      if(critChance > random) return critMultiplier
      else return 1
    }

    const dmg = typeOfAtt().dmg
    const typeDmgMult = typeMultiplier().dmg
    const typeHitChanceMult = typeMultiplier().hitChance
    const bonusMult = bonusMultiplier()
    const crit = critFc()

    const enemyArmor = typeOfAtt().armor

    // calculate damage and round to a whole number
    const minDmg = mainData.global.minDmg
    const md = mainData.global.minDmgDisp // min dmg dispersion

    let damageDealtToEnemy = (dmg * typeDmgMult * bonusMult) - enemyArmor
    // if damage dealt is less than minDmg => set damage dealt to random * minDmg
    damageDealtToEnemy = damageDealtToEnemy < minDmg ? minDmg * randomGenerator(md.min, md.max, md.perc) : damageDealtToEnemy
    damageDealtToEnemy *= typeDmgMult // multiply by type of attack mult
    damageDealtToEnemy *= crit // then apply crit
    damageDealtToEnemy = Math.round(damageDealtToEnemy) // and round to a whole number

    const didDodge = () => {
      let dodgeChance = typeOfAtt().dodge
      dodgeChance = (dodgeChance * typeHitChanceMult).toFixed(2)
      const random = randomGenerator(0, 100, 1)

      if (dodgeChance > random) return true
      else return false
    }

    const dodged = didDodge()

    const receivedCrit = () => {
      if (crit !== 1 && dodged === false) {
        return true
      } 
      else return false
    }

    const didReceiveCrit = receivedCrit()

    const currentHp = props.enemy.currentHp
    const newHp = dodged ? currentHp : currentHp - damageDealtToEnemy
    const damageTaken = dodged ? "Dodged" : damageDealtToEnemy

    const realDmgDealt = dodged ? 0 : damageDealtToEnemy

    // Handle - if HP is 0 or less => end game, if not => continue
    if(props.enemy.currentHp - realDmgDealt <= 0) return gameHandler(props, "Player", "End", newHp, damageTaken, didReceiveCrit) 
    else return gameHandler(props, "Player", "Continue", newHp, damageTaken, didReceiveCrit)
}
