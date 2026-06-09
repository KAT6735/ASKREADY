"use strict";
var CCJsScriptClass = class {
    constructor() {
        this.MultiInputNum = 8;
        this.MultiInputHide = true;
        this.BlendToCanvas = false;
        this.CloneClipLayerStart = 1e6;
        this.m_instanceId = 0;
        this.m_clipsGruopsMap = new Map();
        this.ClipsGroupsMapMaxSize = 100;
        this.m_useSrcVideo = false;
        this.MultiInputStartKey = [
            "effects_adjust_background_animation",
            "effects_adjust_distortion",
            "effects_adjust_soft",
            "effects_adjust_horizontal_chromatic",
            "effects_adjust_horizontal_shift",
            "effects_adjust_luminance",
            "effects_adjust_noise",
            "effects_adjust_rotate",
            "effects_adjust_sharpen"
        ];
        this.MultiInputStartKey = this.MultiInputStartKey.slice(0, this.MultiInputNum - 1);
        this.m_multiInputStart = [];
        for (let i = 1; i <= this.MultiInputNum - 1; i++) {
            this.m_multiInputStart.push(i / this.MultiInputNum);
        }
    }
    clone() {
        var newScript = new CCJsScriptClass();
        newScript.m_instanceId = this.m_instanceId;
        newScript.m_clipsGruopsMap = new Map();
        this.m_clipsGruopsMap.forEach((clipGroups, version) => {
            const newClipGroups = [];
            clipGroups.forEach(clipGroup => {
                const newClipGroup = clipGroup.map(clipCache => ({
                    id: clipCache.id,
                    layer: clipCache.layer,
                    seqIn: clipCache.seqIn,
                    seqOut: clipCache.seqOut,
                    visible: clipCache.visible
                }));
                newClipGroups.push(newClipGroup);
            });
            newScript.m_clipsGruopsMap.set(version, newClipGroups);
        });
        newScript.m_useSrcVideo = this.m_useSrcVideo;
        newScript.m_multiInputStart = this.m_multiInputStart.slice();
        CCLOGE("CCJsScript clone.");
        return newScript;
    }
    onInit(clip, scriptId) {
        this.m_instanceId = scriptId;
        CCLOGE("CCJsScript onInit instanceId: " + this.m_instanceId);
    }
    onMediaTimelinePreBuild(clip, timeline) {
        CCLOGE("CCJsScript onMediaTimelinePreBuild.");
        this._updateSliderParam(clip);
        this._updateClipsGroups(clip, timeline);
        clip.setParamValue(CC_JS_SCRIPT_MULTI_INPUT_FRAME_ORIGIN, this.m_useSrcVideo);
        clip.setParamValue(CC_JS_SCRIPT_MULTI_INPUT_BLEND_TO_CANVAS, this.BlendToCanvas);
        var parentClipId = clip.getParentClipId();
        if (parentClipId != undefined) {
            return;
        }
        clip.setParamValue(CC_JS_SCRIPT_MULTI_INPUT_HIDE, this.MultiInputHide);
    }
    onMediaTimelineBuild(clip, timeline) {
    }
    onUpdate(clip, timeStamp, timeline, currentVersion) {
        if (clip.getClipVisible() == false) {
            clip.setParamValue(CC_JS_SCRIPT_MULTI_INPUT_CLIP, []);
            CCLOGI("CCJsScript onUpdate clip visible false");
            return;
        }
        var parentClipId = clip.getParentClipId();
        if (parentClipId != undefined) {
            CCLOGI("CCJsScript onUpdate parentClipId exist");
            var multiInputClipIds = [];
            for (var i = 0; i < this.MultiInputNum; i++) {
                multiInputClipIds.push(parentClipId);
            }
            this._updateSliderParam(clip);
            clip.setParamValue(CC_JS_SCRIPT_MULTI_INPUT_CLIP, multiInputClipIds);
            clip.setParamValue(CC_JS_SCRIPT_MULTI_INPUT_HIDE, false);
            return;
        }
        let _clipsGruops = this.m_clipsGruopsMap.get(currentVersion);
        if (_clipsGruops == undefined) {
            CCLOGE("CCJsScript onUpdate currentVersion" + currentVersion + " not exist!");
            return;
        }
        let clipsGruopsCount = _clipsGruops.length;
        if (clipsGruopsCount <= 0) {
            clip.setParamValue(CC_JS_SCRIPT_MULTI_INPUT_CLIP, []);
            CCLOGI("CCJsScript onUpdate clipsGruopsCount 0");
            return;
        }
        var multiInputClipIds = [];
        for (var i = 0; i < this.MultiInputNum; i++) {
            let group = _clipsGruops[i % clipsGruopsCount];
            var clipId = "";
            group.forEach(iClip => {
                if (timeStamp >= iClip.seqIn && timeStamp < iClip.seqOut) {
                    clipId = iClip.id;
                }
            });
            multiInputClipIds.push(clipId);
        }
        clip.setParamValue(CC_JS_SCRIPT_MULTI_INPUT_CLIP, multiInputClipIds);
    }
    _updateSliderParam(clip) {
        let sliderParamStr = clip.getParamValue(AMAZING_EFFECT_PARAM);
        if (typeof sliderParamStr === "string") {
            let sliderParam = JSON.parse(sliderParamStr);
            if (sliderParam != undefined) {
                if (sliderParam.effects_adjust_speed != undefined) {
                    let ratio = sliderParam.effects_adjust_speed;
                    ratio = Math.max(0, Math.min(1, ratio));
                    let minSpeed = 0.25;
                    let maxSpeed = 4.0;
                    var speed = 1.0;
                    if (ratio < 0.5) {
                        speed = minSpeed + (1.0 - minSpeed) * ratio * 2;
                    }
                    else {
                        speed = 1.0 + (maxSpeed - 1.0) * (ratio - 0.5) * 2;
                    }
                    let jsParam = {
                        ae_adjust_speed: speed,
                        ae_integer_frame_tick: false,
                    };
                    sliderParam.ae_adjust_speed = speed;
                    sliderParam.ae_integer_frame_tick = false;
                    var parentClipId = clip.getParentClipId();
                    if (parentClipId != undefined) {
                        jsParam.ae_blend_to_out_texture = false;
                        sliderParam.ae_blend_to_out_texture = false;
                    }
                    clip.setParamValue(CC_JS_SCRIPT_UPDATE_PARAMS, JSON.stringify(jsParam));
                    clip.setParamValue(AMAZING_EFFECT_PARAM, JSON.stringify(sliderParam));
                }
                if (sliderParam.effects_adjust_intensity != undefined) {
                    this.m_useSrcVideo = sliderParam.effects_adjust_intensity < 0.5;
                }
                for (let i = 0; i < this.MultiInputStartKey.length; i++) {
                    let key = this.MultiInputStartKey[i];
                    if (sliderParam[key] != undefined) {
                        this.m_multiInputStart[i] = sliderParam[key];
                    }
                }
            }
        }
    }
    _updateClipsGroups(clip, timeline) {
        if (this.m_clipsGruopsMap.size >= this.ClipsGroupsMapMaxSize) {
            let minVersion = Number.MAX_SAFE_INTEGER;
            this.m_clipsGruopsMap.forEach((_, iVersion) => {
                if (iVersion < minVersion) {
                    minVersion = iVersion;
                }
            });
            this.m_clipsGruopsMap.delete(minVersion);
        }
        if (clip.getClipVisible() == false) {
            CCLOGE("CCJsScript _updateClipsGroups clip visible false");
            return;
        }
        if (clip.getParentClipId() != undefined) {
            return;
        }
        let version = timeline.getVersion() + 1;
        var _clipsGruops = [];
        let types = [
            ETEClipType.TEClipType_Video,
            ETEClipType.TEClipType_VideoAudio,
            ETEClipType.TEClipType_Image,
            ETEClipType.TEClipType_Sequence
        ];
        let originClips = timeline.getClipsByType(types);
        var clips = originClips.map((iClip) => {
            var cache = {
                id: iClip.getClipId(),
                layer: iClip.getClipLayer(),
                seqIn: iClip.getSeqIn(),
                seqOut: iClip.getSeqOut(),
                visible: iClip.getClipVisible(),
            };
            return cache;
        });
        let effectClipLayer = clip.getClipLayer();
        let visibleClips = clips.filter(iClip => {
            return iClip.visible && iClip.layer < effectClipLayer;
        });
        let sortedClips = visibleClips.sort((a, b) => {
            if (a.layer != b.layer) {
                return a.layer - b.layer;
            }
            else {
                return a.seqIn - b.seqIn;
            }
        });
        if (sortedClips.length <= 0) {
            return;
        }
        let mainTrackLayer = sortedClips[0].layer;
        let mainClips = sortedClips.filter(iClip => {
            return iClip.layer == mainTrackLayer;
        });
        _clipsGruops.push(mainClips);
        let mainClipsOut = mainClips[mainClips.length - 1].seqOut;
        mainClips.forEach((iClip, index) => {
            if (index > 0) {
                if (iClip.seqIn < mainClips[index - 1].seqOut) {
                    let center = (mainClips[index - 1].seqOut + iClip.seqIn) / 2;
                    iClip.seqIn = center;
                    mainClips[index - 1].seqOut = center;
                }
            }
        });
        let effectSeqIn = clip.getSeqIn();
        let effectSeqOut = clip.getSeqOut();
        let effectLen = effectSeqOut - effectSeqIn;
        for (let i = 1; i < this.MultiInputNum; i++) {
            let iStartPercent = this.m_multiInputStart[i - 1];
            if (iStartPercent >= 1.0) {
                iStartPercent = 0.9999;
            }
            let iStart = iStartPercent * mainClipsOut;
            let iEnd = iStart + effectLen;
            var baseClips = mainClips.filter(iClip => {
                return iClip.seqIn + 1 < iEnd && iClip.seqOut - 1 > iStart;
            });
            let baseClipsLen = baseClips.length;
            var cloneClips = [];
            let iOffset = -iStart + effectSeqIn;
            baseClips.forEach((iClip, index) => {
                let cloneClip = timeline.getCloneClipWithNoEffectClip(iClip.id);
                if (cloneClip !== undefined) {
                    var newSeqIn = iClip.seqIn + iOffset;
                    if (newSeqIn < effectSeqIn) {
                        let delta = effectSeqIn - newSeqIn;
                        var trimIn = cloneClip.getTrimIn() + delta;
                        cloneClip.setTrimIn(trimIn);
                        newSeqIn = effectSeqIn;
                    }
                    var newSeqOut = iClip.seqOut + iOffset;
                    if (newSeqOut > effectSeqOut) {
                        let delta = newSeqOut - effectSeqOut;
                        var trimOut = cloneClip.getTrimOut() - delta;
                        cloneClip.setTrimOut(trimOut);
                        newSeqOut = effectSeqOut;
                    }
                    else {
                        if (index == baseClipsLen - 1 && newSeqOut < effectSeqOut) {
                            newSeqOut = effectSeqOut;
                        }
                    }
                    cloneClip.setSeqIn(newSeqIn);
                    cloneClip.setSeqOut(newSeqOut);
                    let layer = this.CloneClipLayerStart + this.m_instanceId * 1e3 + i;
                    cloneClip.setClipLayer(layer);
                    var cache = {
                        id: cloneClip.getClipId(),
                        layer: cloneClip.getClipLayer(),
                        seqIn: cloneClip.getSeqIn(),
                        seqOut: cloneClip.getSeqOut(),
                        visible: cloneClip.getClipVisible(),
                    };
                    cloneClips.push(cache);
                }
            });
            _clipsGruops.push(cloneClips);
        }
        this.m_clipsGruopsMap.set(version, _clipsGruops);
    }
};
var CCJsScript = new CCJsScriptClass();
