//=============================================================================
// Zeorem - Battle Audio
// ZEM_BattleSounds.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Allows playing voice and audio files at various points during battle
 * @author Zeorem
 * @version 1.1
 * 
 * @param victoryMe
 * @type switch
 * @text Enable Victory ME?
 * @desc Enable Victory ME?
 * @default 1
 * 
 * @param defeatMe
 * @type switch
 * @text Enable Defeat ME?
 * @desc Enable Defeat ME?
 * @default 2
 * 
 * @param useCmdSound
 * @type switch
 * @text Enable Start Command Sound?
 * @desc Enable Start Command Sound?
 * @default 3
 * 
 * @param startCmdSound
 * @type file
 * @text Start Command Sound Filename
 * @desc Start Command Sound Filename
 * @default audio/se/Attack2
 * @help
 * 
 * ------------
 * Introduction
 * ------------
 * 
 * This plugin introduces the ability to play audio files at 
 * various moments during battle:
 * 
 * At the start of every Actor's turn, or more specifically whenever the
 * Actor Command menu comes up.
 * 
 * Actors and Enemies can be given a set of sounds to play at several moments in
 * battle, when they perform certain actions, or react to situations, like damage cries or 
 * saying things as battle commentary. 
 * 
 * Additionally, the developer may disable/enable the playing of Victory Fanfare 
 * and Defeat after the battle. This may be useful if you want the battle 
 * bgm to continue uninterrupted after the battle ends, without the Victory ME
 * (or the lack of it) interrupting it.
 * 
 * ----------
 * How to use
 * ----------
 * 
 * Place your audio files in the audio/se folder.
 * 
 * Then you can associate any number of those files to your battlers 
 * by using the following notetags:
 * 
 * Format:
 * 
 * <Tag Name: Filenames separated by comma (without extension)>
 * 
 * 
 * --------------
 * Actor Notetags
 * --------------
 * 
 * <Voice Battle Start: filenames>          Voices that may play at the start 
 *                                          of the battle.
 * <Voice Battle Preemptive: filenames>     Voices that may play if the player 
 *                                          gets a preemptive strike.
 * <Voice Battle Surprise: filenames>       Voices that may play if the player 
 *                                          suffers a surprise attack.
 * <Voice Battle Victory: filenames>        Voices that may play when the 
 *                                          player wins the battle.
 * 
 * <Voice Cmd Start: filenames>             Voices that may play at the start 
 *                                          of the actor's turn.
 * <Voice Cmd Attack: filenames>            Voices that may play when  
 *                                          the attack command is selected.
 * <Voice Cmd SkillType x: filenames>       Voices that may play when x type  
 *                                          of skill command is selected.
 *                                          (x = the skill type id in database)
 *                                          (Ex: 1 = magic, 2 = special, etc.)
 * <Voice Cmd SkillTypes x,y,z: filenames>  Voices that may play when any of  
 *                                          the skill types is selected.
 * <Voice Cmd Guard: filenames>             Voices that may play when Guard is 
 *                                          selected.
 * <Voice Cmd Item: filenames>              Voices that may play when Item is 
 *                                          selected. 
 * 
 * ------------------------
 * Actor and Enemy Notetags
 * ------------------------
 * 
 * <Voice Action Damage: filenames>         Voices that may play when the 
 *                                          battler receives damage. 
 * 
 * <Voice Action Avoid: filenames>          Voices that may play when  
 *                                          the battler evades an attack.
 * 
 * <Voice Action Collapse: filenames>       Voices that may play when the 
 *                                          battler gets KO'ed in battle.
 *
 * --------
 * Examples 
 * --------
 * 
 * <Voice Battle Start: actor1_start1, actor1_voice2>  
 * <Voice Cmd Attack: attackVoiceElliot>        
 * <Voice Cmd Skill 1: Magic01, Magic02, Magic03>    
 * <Voice Cmd Skills 2,5,6: skillAudio, powerupCall>    
 * <Voice Cmd Guard: actor1_defend>         
 * <Voice Action Damage: hurt01, hurt02> 
 * <Voice Action Collapse: reidDown1, reidDown2> 
 * 
 * The files can be named how you like but generally avoid using spaces 
 * or other special characters in their names to prevent any errors.
 * 
 * 
 * ---------
 * Changelog
 * ---------
 * 
 * 1.1.0 General stability improvements to enhance the user experience.
 * 1.0.0 Finished Plugin
 * 
 * --------------------------------------------------------------------
 * 
 */

(() => {

    'use strict';

    const zemBSoundParameters = PluginManager.parameters('ZEM_BattleAudio');
    const zemEnableStartCommandSound = JSON.parse(zemBSoundParameters['useCmdSound']);
    const zemEnableVictoryMe = JSON.parse(zemBSoundParameters['victoryMe']);
    const zemEnableDefeatMe = JSON.parse(zemBSoundParameters['defeatMe']);

    let battleVoicesStart, battleVoicesVictory;
    let startCmdSound = zemBSoundParameters['startCmdSound'];

    BattleManager.playVictoryMe = function() {
        if ($gameSwitches.value(zemEnableVictoryMe)) {
            AudioManager.playMe($gameSystem.victoryMe());
        }
    }

    BattleManager.playDefeatMe = function() {
        if ($gameSwitches.value(zemEnableDefeatMe)) {
            AudioManager.playMe($gameSystem.defeatMe());
        }  
    }

    const toCamelCase = function (stg) {
        return stg.replace(stg[0], stg[0].toLowerCase()).replaceAll(" ", "");
    }

    const bVoice_gameActorSetup = Game_Actor.prototype.setup;  
    Game_Actor.prototype.setup = function (actorId) {

        bVoice_gameActorSetup.call(this, actorId);

        processVoiceNotetags(this);
    }

    const bVoice_gameEnemySetup = Game_Enemy.prototype.setup;  
    Game_Enemy.prototype.setup = function (enemyId, x, y) {

        bVoice_gameEnemySetup.call(this, enemyId, x, y);

        processVoiceNotetags(this);
    }

    const processVoiceNotetags = function (battler) {
        battler._battleVoices = {};
        let _notetags;
        
        if (battler.isActor()) {
            _notetags = $dataActors[battler.actorId()].meta;
        }
        else if (battler.isEnemy()) {
            _notetags = $dataEnemies[battler.enemyId()].meta;
        }

        if (_notetags) {
            for (const tag in _notetags) {
                
                let ftg, voicesList;
                
                if (tag) {
                    
                    voicesList = _notetags[tag].trim().replaceAll("\n","").replaceAll(" ","").split(",");
                
                    if (tag.startsWith("Voice Cmd SkillTypes")) {
                        let skillIds = tag.replace("Voice Cmd SkillTypes ", "").trim().replaceAll(" ","").replaceAll("\n","").split(",");
                        for (const s of skillIds) {
                            let t;
                            if (s == '0'){
                                t = 'cmdAttack';
                            }
                            else {
                                t= "cmdSkillType"+s;
                            }
                            battler._battleVoices[t] = voicesList;
                        }
                    }
                    else if (tag.startsWith("Voice")) {

                        ftg = toCamelCase(tag.replace("Voice ", "").trim().replaceAll("\n",""));
                        
                        if (ftg == 'cmdSkillType0') {ftg = 'cmdAttack'};
                        
                        battler._battleVoices[ftg] = voicesList;
                    }          
                }
            }
        }
    }

    Game_Battler.prototype.playRandomBattleVoice = function (voiceTag){
            
        let battleVoice = this.getRandomBattleVoice(voiceTag);

        if (battleVoice) {
                
            AudioManager.stopSe();

            AudioManager.playSe(battleVoice);
            
            }
    }
    
    Game_Battler.prototype.getRandomBattleVoice = function (voiceTag) {

        if (this._battleVoices && this._battleVoices[voiceTag]) {
            
            let voiceName = this._battleVoices[voiceTag][Math.randomInt(this._battleVoices[voiceTag].length)];
            
            if (voiceName) {
                return {name: voiceName, pan: 0, pitch: 100, volume: 90};
            
            }
        }
    }

    const bVoice_GmBattlerPerformMiss = Game_Battler.prototype.performMiss;
    Game_Battler.prototype.performMiss = function() {

        bVoice_GmBattlerPerformMiss.call(this);

        this.playRandomBattleVoice('actionAvoid');

    };

    const bVoice_GmBattlerPerformEvasion = Game_Battler.prototype.performEvasion;
    Game_Battler.prototype.performEvasion = function() {

        bVoice_GmBattlerPerformEvasion.call(this);

        this.playRandomBattleVoice('actionAvoid');

    };

    const bVoice_GmBattlerPerformMagicEvasion = Game_Battler.prototype.performMagicEvasion;
    Game_Battler.prototype.performMagicEvasion = function() {

        bVoice_GmBattlerPerformMagicEvasion.call(this);

        this.playRandomBattleVoice('actionAvoid');

    };

    const bVoice_GmBattlerPerformCollapse = Game_Battler.prototype.performCollapse;
    Game_Battler.prototype.performCollapse = function() {
        this.playRandomBattleVoice('actionCollapse');
        bVoice_GmBattlerPerformCollapse.call(this);
    };

    const bVoice_GmBattlerPerformDamage = Game_Battler.prototype.performDamage;
    Game_Battler.prototype.performDamage = function() {

        bVoice_GmBattlerPerformDamage.call(this);
        if (this.isAlive()) {
            this.playRandomBattleVoice('actionDamage');
        }

    };

    const bVoice_GmPartyPerformVictory = Game_Party.prototype.performVictory;
    Game_Party.prototype.performVictory = function() {
        
        bVoice_GmPartyPerformVictory.call(this);

        battleVoicesVictory = [];

        for (const a of $gameParty.aliveMembers()) {

            if (a._battleVoices.hasOwnProperty('battleVictory')) {

                battleVoicesVictory = battleVoicesVictory.concat(a._battleVoices['battleVictory']);

            }
        }

        let voice = battleVoicesVictory[Math.randomInt(battleVoicesVictory.length)];

        if (voice) {
            AudioManager.playSe({name:voice, pan: 0, pitch: 100, volume: 90});
        }
    };

    const bVoice_gameSystemOnBattleStart = Game_System.prototype.onBattleStart;
    
    Game_System.prototype.onBattleStart = function() {

        bVoice_gameSystemOnBattleStart.apply(this, arguments);

        battleVoicesStart = [];

        let tag;

        if (BattleManager._surprise) {
            tag = 'battleSurprise';
        }
        else if (BattleManager._preemptive) {
            tag = 'battlePreemptive';
        }

        for (const a of $gameParty.aliveMembers()) {

            if (BattleManager._surprise && a._battleVoices.hasOwnProperty('battleSurprise')) {

                battleVoicesStart = battleVoicesStart.concat(a._battleVoices['battleSurprise']);

            }
            else if (BattleManager._preemptive && a._battleVoices.hasOwnProperty('battlePreemptive')) {

                battleVoicesStart = battleVoicesStart.concat(a._battleVoices['battlePreemptive']);

            }
            else if (a._battleVoices.hasOwnProperty('battleStart') && !BattleManager._preemptive && !BattleManager._surprise) {

                battleVoicesStart = battleVoicesStart.concat(a._battleVoices['battleStart']);

            }
        }

        let voice = battleVoicesStart[Math.randomInt(battleVoicesStart.length)];

        if (voice) {
            AudioManager.playSe({name:voice, pan: 0, pitch: 100, volume: 90});
        }
        
    }

    const bVoice_SceBatStartActorCmdSelection = Scene_Battle.prototype.startActorCommandSelection;
    Scene_Battle.prototype.startActorCommandSelection = function() {

        bVoice_SceBatStartActorCmdSelection.call(this);

        if ($gameSwitches.value(zemEnableStartCommandSound) && !BattleManager.actor()._battleVoices['cmdStart']) {
            AudioManager.playSe({name:startCmdSound.replace("audio/se/", ""), pan: 0, pitch: 100, volume: 100});
        }

        if (BattleManager.actor()) {

            BattleManager.actor().playRandomBattleVoice('cmdStart');
            
        }
    }

    const bVoice_ScBatCmdAtk = Scene_Battle.prototype.commandAttack;
    Scene_Battle.prototype.commandAttack = function() {

        bVoice_ScBatCmdAtk.call(this);

        if (BattleManager.actor()) {

            BattleManager.actor().playRandomBattleVoice('cmdAttack');

        }
    }

    const bVoice_ScBatCmdGrd = Scene_Battle.prototype.commandGuard;
    Scene_Battle.prototype.commandGuard = function() {

        if (BattleManager.actor()) {

            BattleManager.actor().playRandomBattleVoice('cmdGuard');

        }

        bVoice_ScBatCmdGrd.call(this, arguments);
    }

    const bVoice_ScBatCmdItem = Scene_Battle.prototype.commandItem;
    Scene_Battle.prototype.commandItem = function() {

        if (BattleManager.actor()) {

            BattleManager.actor().playRandomBattleVoice('cmdItem');

        }

        bVoice_ScBatCmdItem.call(this, arguments);
    }

    const bVoice_ScBatCmdSkill = Scene_Battle.prototype.commandSkill;
    Scene_Battle.prototype.commandSkill = function() {

        bVoice_ScBatCmdSkill.call(this);

        if (BattleManager.actor()) {

            BattleManager.actor().playRandomBattleVoice('cmdSkillType'+this._skillWindow._stypeId.toString());

        }
    }

})(); // the end
