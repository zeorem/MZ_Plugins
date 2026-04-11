//=============================================================================
// ZEM_RememberTargets.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Makes the Battle Manager track an action's targets so they can
 * be used in common events and notetags.
 * @author Zeorem
 *
 * @help
 * 
 * By default, MZ's BattleManager doesn't store the targets list of a battle
 * action (Skill or Item), as when the action is executed on each target, that
 * target is deleted from the list. However, sometimes we may want to do 
 * something with those targets while or after the skill is executed, 
 * for example, in a common event added to that skill's effects. 
 * 
 * This plugin creates a new _actionTargets array within the BattleManager
 * to store those targets separatedly, then you can use said list to execute 
 * code on the targets.
 * 
 * Changelog:
 * 
 * v0.2 - Changed the name to _actionTargets for better recognizeability.
 * v0.1 - Finished plugin. 
 * 
 */

(() => {
    'use strict';

    BattleManager._actionTargets = [];

    const _zemActTargetsBManagerUpdateAction = BattleManager.updateAction;

    BattleManager.updateAction = function() {
        if (this._targets[0] != undefined) {
            this._actionTargets.push(this._targets[0]);
        }
        _zemActTargetsBManagerUpdateAction.call(this);
    };

    const _zemActTargetsBManagerStartAction = BattleManager.startAction;

    BattleManager.startAction = function() {
        this._actionTargets = []
        _zemActTargetsBManagerStartAction.call(this);
    };

})();