/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../internal/channel_handlers/channel_logger.ts"
/*!******************************************************!*\
  !*** ../internal/channel_handlers/channel_logger.ts ***!
  \******************************************************/
(__unused_webpack_module, exports) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChannelLogger = void 0;
/**
 * Helper class that helps log channel resources, updates or errors.
 */
class ChannelLogger {
    constructor(logSourceType, 
    // @ts-ignore
    callback = (logEvent) => { }) {
        this.logSourceType = logSourceType;
        this.callback = callback;
    }
    log(level, logString, relevantObject) {
        this.callback({
            sourceType: this.logSourceType,
            level,
            logString,
            relevantObject,
        });
    }
}
exports.ChannelLogger = ChannelLogger;


/***/ },

/***/ "../internal/channel_handlers/media_entries_channel_handler.ts"
/*!*********************************************************************!*\
  !*** ../internal/channel_handlers/media_entries_channel_handler.ts ***!
  \*********************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MediaEntriesChannelHandler = void 0;
const enums_1 = __webpack_require__(/*! ../../types/enums */ "../types/enums.ts");
const subscribable_impl_1 = __webpack_require__(/*! ../subscribable_impl */ "../internal/subscribable_impl.ts");
const utils_1 = __webpack_require__(/*! ../utils */ "../internal/utils.ts");
/**
 * Helper class to handle the media entries channel.
 */
class MediaEntriesChannelHandler {
    constructor(channel, mediaEntriesDelegate, idMediaEntryMap, internalMediaEntryMap = new Map(), internalMeetStreamTrackMap = new Map(), internalMediaLayoutMap = new Map(), participantsDelegate, nameParticipantMap, idParticipantMap, internalParticipantMap, presenterDelegate, screenshareDelegate, channelLogger) {
        this.channel = channel;
        this.mediaEntriesDelegate = mediaEntriesDelegate;
        this.idMediaEntryMap = idMediaEntryMap;
        this.internalMediaEntryMap = internalMediaEntryMap;
        this.internalMeetStreamTrackMap = internalMeetStreamTrackMap;
        this.internalMediaLayoutMap = internalMediaLayoutMap;
        this.participantsDelegate = participantsDelegate;
        this.nameParticipantMap = nameParticipantMap;
        this.idParticipantMap = idParticipantMap;
        this.internalParticipantMap = internalParticipantMap;
        this.presenterDelegate = presenterDelegate;
        this.screenshareDelegate = screenshareDelegate;
        this.channelLogger = channelLogger;
        this.channel.onmessage = (event) => {
            this.onMediaEntriesMessage(event);
        };
        this.channel.onopen = () => {
            var _a;
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Media entries channel: opened');
        };
        this.channel.onclose = () => {
            var _a;
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Media entries channel: closed');
        };
    }
    onMediaEntriesMessage(message) {
        var _a, _b;
        const data = JSON.parse(message.data);
        let mediaEntryArray = this.mediaEntriesDelegate.get();
        // Delete media entries.
        (_a = data.deletedResources) === null || _a === void 0 ? void 0 : _a.forEach((deletedResource) => {
            var _a;
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.RESOURCES, 'Media entries channel: resource deleted', deletedResource);
            const deletedMediaEntry = this.idMediaEntryMap.get(deletedResource.id);
            if (deletedMediaEntry) {
                mediaEntryArray = mediaEntryArray.filter((mediaEntry) => mediaEntry !== deletedMediaEntry);
                // If we find the media entry in the id map, it should exist in the
                // internal map.
                const internalMediaEntry = this.internalMediaEntryMap.get(deletedMediaEntry);
                // Remove relationship between media entry and media layout.
                const mediaLayout = internalMediaEntry.mediaLayout.get();
                if (mediaLayout) {
                    const internalMediaLayout = this.internalMediaLayoutMap.get(mediaLayout);
                    if (internalMediaLayout) {
                        internalMediaLayout.mediaEntry.set(undefined);
                    }
                }
                // Remove relationship between media entry and meet stream tracks.
                const videoMeetStreamTrack = internalMediaEntry.videoMeetStreamTrack.get();
                if (videoMeetStreamTrack) {
                    const internalVideoStreamTrack = this.internalMeetStreamTrackMap.get(videoMeetStreamTrack);
                    internalVideoStreamTrack.mediaEntry.set(undefined);
                }
                const audioMeetStreamTrack = internalMediaEntry.audioMeetStreamTrack.get();
                if (audioMeetStreamTrack) {
                    const internalAudioStreamTrack = this.internalMeetStreamTrackMap.get(audioMeetStreamTrack);
                    internalAudioStreamTrack.mediaEntry.set(undefined);
                }
                // Remove relationship between media entry and participant.
                const participant = internalMediaEntry.participant.get();
                if (participant) {
                    const internalParticipant = this.internalParticipantMap.get(participant);
                    const newMediaEntries = internalParticipant.mediaEntries
                        .get()
                        .filter((mediaEntry) => mediaEntry !== deletedMediaEntry);
                    internalParticipant.mediaEntries.set(newMediaEntries);
                    internalMediaEntry.participant.set(undefined);
                }
                // Remove from maps
                this.idMediaEntryMap.delete(deletedResource.id);
                this.internalMediaEntryMap.delete(deletedMediaEntry);
                if (this.screenshareDelegate.get() === deletedMediaEntry) {
                    this.screenshareDelegate.set(undefined);
                }
                if (this.presenterDelegate.get() === deletedMediaEntry) {
                    this.presenterDelegate.set(undefined);
                }
            }
        });
        // Update or add media entries.
        const addedMediaEntries = [];
        (_b = data.resources) === null || _b === void 0 ? void 0 : _b.forEach((resource) => {
            var _a, _b, _c, _d, _e;
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.RESOURCES, 'Media entries channel: resource added', resource);
            let internalMediaEntry;
            let mediaEntry;
            let videoCsrc = 0;
            if (resource.mediaEntry.videoCsrcs &&
                resource.mediaEntry.videoCsrcs.length > 0) {
                // We expect there to only be one video Csrcs. There is possibility
                // for this to be more than value in WebRTC but unlikely in Meet.
                // TODO : Explore making video csrcs field singluar.
                videoCsrc = resource.mediaEntry.videoCsrcs[0];
            }
            else {
                (_b = this.channelLogger) === null || _b === void 0 ? void 0 : _b.log(enums_1.LogLevel.ERRORS, 'Media entries channel: more than one video Csrc in media entry', resource);
            }
            if (this.idMediaEntryMap.has(resource.id)) {
                // Update media entry if it already exists.
                mediaEntry = this.idMediaEntryMap.get(resource.id);
                mediaEntry.sessionName = resource.mediaEntry.sessionName;
                mediaEntry.session = resource.mediaEntry.session;
                internalMediaEntry = this.internalMediaEntryMap.get(mediaEntry);
                internalMediaEntry.audioMuted.set(resource.mediaEntry.audioMuted);
                internalMediaEntry.videoMuted.set(resource.mediaEntry.videoMuted);
                internalMediaEntry.screenShare.set(resource.mediaEntry.screenshare);
                internalMediaEntry.isPresenter.set(resource.mediaEntry.presenter);
                internalMediaEntry.audioCsrc = resource.mediaEntry.audioCsrc;
                internalMediaEntry.videoCsrc = videoCsrc;
            }
            else {
                // Create new media entry if it does not exist.
                const mediaEntryElement = (0, utils_1.createMediaEntry)({
                    audioMuted: resource.mediaEntry.audioMuted,
                    videoMuted: resource.mediaEntry.videoMuted,
                    screenShare: resource.mediaEntry.screenshare,
                    isPresenter: resource.mediaEntry.presenter,
                    id: resource.id,
                    audioCsrc: resource.mediaEntry.audioCsrc,
                    videoCsrc,
                    sessionName: resource.mediaEntry.sessionName,
                    session: resource.mediaEntry.session,
                });
                internalMediaEntry = mediaEntryElement.internalMediaEntry;
                mediaEntry = mediaEntryElement.mediaEntry;
                this.internalMediaEntryMap.set(mediaEntry, internalMediaEntry);
                this.idMediaEntryMap.set(internalMediaEntry.id, mediaEntry);
                addedMediaEntries.push(mediaEntry);
            }
            // Assign meet streams to media entry if they are not already assigned
            // correctly.
            if (!mediaEntry.audioMuted.get() &&
                internalMediaEntry.audioCsrc &&
                !this.isMediaEntryAssignedToMeetStreamTrack(internalMediaEntry)) {
                this.assignAudioMeetStreamTrack(mediaEntry, internalMediaEntry);
            }
            // Assign participant to media entry
            let existingParticipant;
            if (resource.mediaEntry.participant) {
                existingParticipant = this.nameParticipantMap.get(resource.mediaEntry.participant);
            }
            else if (resource.mediaEntry.participantKey) {
                existingParticipant = (_c = Array.from(this.internalParticipantMap.entries()).find(([participant, _]) => participant.participant.participantKey ===
                    resource.mediaEntry.participantKey)) === null || _c === void 0 ? void 0 : _c[0];
            }
            if (existingParticipant) {
                const internalParticipant = this.internalParticipantMap.get(existingParticipant);
                if (internalParticipant) {
                    const newMediaEntries = [
                        ...internalParticipant.mediaEntries.get(),
                        mediaEntry,
                    ];
                    internalParticipant.mediaEntries.set(newMediaEntries);
                }
                internalMediaEntry.participant.set(existingParticipant);
            }
            else if (resource.mediaEntry.participant ||
                resource.mediaEntry.participantKey) {
                // This is unexpected behavior, but technically possible. We expect
                // that the participants are received from the participants channel
                // before the media entries channel but this is not guaranteed.
                (_d = this.channelLogger) === null || _d === void 0 ? void 0 : _d.log(enums_1.LogLevel.RESOURCES, 'Media entries channel: participant not found in name participant map' +
                    ' creating participant');
                const subscribableDelegate = new subscribable_impl_1.SubscribableDelegate([
                    mediaEntry,
                ]);
                const newParticipant = {
                    participant: {
                        name: resource.mediaEntry.participant,
                        anonymousUser: {},
                        participantKey: resource.mediaEntry.participantKey,
                    },
                    mediaEntries: subscribableDelegate.getSubscribable(),
                };
                // TODO: Use participant resource name instead of id.
                // tslint:disable-next-line:deprecation
                const ids = resource.mediaEntry.participantId
                    ? // tslint:disable-next-line:deprecation
                        new Set([resource.mediaEntry.participantId])
                    : new Set();
                const internalParticipant = {
                    name: (_e = resource.mediaEntry.participant) !== null && _e !== void 0 ? _e : '',
                    ids,
                    mediaEntries: subscribableDelegate,
                };
                if (resource.mediaEntry.participant) {
                    this.nameParticipantMap.set(resource.mediaEntry.participant, newParticipant);
                }
                this.internalParticipantMap.set(newParticipant, internalParticipant);
                // TODO: Use participant resource name instead of id.
                // tslint:disable-next-line:deprecation
                if (resource.mediaEntry.participantId) {
                    this.idParticipantMap.set(
                    // TODO: Use participant resource name instead of id.
                    // tslint:disable-next-line:deprecation
                    resource.mediaEntry.participantId, newParticipant);
                }
                const participantArray = this.participantsDelegate.get();
                this.participantsDelegate.set([...participantArray, newParticipant]);
                internalMediaEntry.participant.set(newParticipant);
            }
            if (resource.mediaEntry.presenter) {
                this.presenterDelegate.set(mediaEntry);
            }
            else if (!resource.mediaEntry.presenter &&
                this.presenterDelegate.get() === mediaEntry) {
                this.presenterDelegate.set(undefined);
            }
            if (resource.mediaEntry.screenshare) {
                this.screenshareDelegate.set(mediaEntry);
            }
            else if (!resource.mediaEntry.screenshare &&
                this.screenshareDelegate.get() === mediaEntry) {
                this.screenshareDelegate.set(undefined);
            }
        });
        // Update media entry collection.
        if ((data.resources && data.resources.length > 0) ||
            (data.deletedResources && data.deletedResources.length > 0)) {
            const newMediaEntryArray = [...mediaEntryArray, ...addedMediaEntries];
            this.mediaEntriesDelegate.set(newMediaEntryArray);
        }
    }
    isMediaEntryAssignedToMeetStreamTrack(internalMediaEntry) {
        const audioStreamTrack = internalMediaEntry.audioMeetStreamTrack.get();
        if (!audioStreamTrack)
            return false;
        const internalAudioMeetStreamTrack = this.internalMeetStreamTrackMap.get(audioStreamTrack);
        // This is not expected. Map should be comprehensive of all meet stream
        // tracks.
        if (!internalAudioMeetStreamTrack)
            return false;
        // The Audio CRSCs changed and therefore need to be checked if the current
        // audio csrc is in the contributing sources.
        const contributingSources = internalAudioMeetStreamTrack.receiver.getContributingSources();
        for (const contributingSource of contributingSources) {
            if (contributingSource.source === internalMediaEntry.audioCsrc) {
                // Audio Csrc found in contributing sources.
                return true;
            }
        }
        // Audio Csrc not found in contributing sources, unassign audio meet stream
        // track.
        internalMediaEntry.audioMeetStreamTrack.set(undefined);
        return false;
    }
    assignAudioMeetStreamTrack(mediaEntry, internalMediaEntry) {
        for (const [meetStreamTrack, internalMeetStreamTrack,] of this.internalMeetStreamTrackMap.entries()) {
            // Only audio tracks are assigned here.
            if (meetStreamTrack.mediaStreamTrack.kind !== 'audio')
                continue;
            const receiver = internalMeetStreamTrack.receiver;
            const contributingSources = receiver.getContributingSources();
            for (const contributingSource of contributingSources) {
                if (contributingSource.source === internalMediaEntry.audioCsrc) {
                    internalMediaEntry.audioMeetStreamTrack.set(meetStreamTrack);
                    internalMeetStreamTrack.mediaEntry.set(mediaEntry);
                    return;
                }
            }
            // If Audio Csrc is not found in contributing sources, fall back to
            // polling frames for assignment.
            internalMeetStreamTrack.maybeAssignMediaEntryOnFrame(mediaEntry, 'audio');
        }
    }
}
exports.MediaEntriesChannelHandler = MediaEntriesChannelHandler;


/***/ },

/***/ "../internal/channel_handlers/media_stats_channel_handler.ts"
/*!*******************************************************************!*\
  !*** ../internal/channel_handlers/media_stats_channel_handler.ts ***!
  \*******************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MediaStatsChannelHandler = void 0;
const enums_1 = __webpack_require__(/*! ../../types/enums */ "../types/enums.ts");
const STATS_TYPE_CONVERTER = {
    'codec': 'codec',
    'candidate-pair': 'candidate_pair',
    'media-playout': 'media_playout',
    'transport': 'transport',
    'local-candidate': 'local_candidate',
    'remote-candidate': 'remote_candidate',
    'inbound-rtp': 'inbound_rtp',
};
/**
 * Helper class to handle the media stats channel. This class is responsible
 * for sending media stats to the backend and receiving configuration updates
 * from the backend. For realtime metrics when debugging manually, use
 * chrome://webrtc-internals.
 */
class MediaStatsChannelHandler {
    constructor(channel, peerConnection, channelLogger) {
        this.channel = channel;
        this.peerConnection = peerConnection;
        this.channelLogger = channelLogger;
        /**
         * A map of allowlisted sections. The key is the section type, and the value
         * is the keys that are allowlisted for that section.
         */
        this.allowlist = new Map();
        this.requestId = 1;
        this.pendingRequestResolveMap = new Map();
        /** Id for the interval to send media stats. */
        this.intervalId = 0;
        this.channel.onmessage = (event) => {
            this.onMediaStatsMessage(event);
        };
        this.channel.onclose = () => {
            var _a;
            clearInterval(this.intervalId);
            this.intervalId = 0;
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Media stats channel: closed');
            // Resolve all pending requests with an error.
            for (const [, resolve] of this.pendingRequestResolveMap) {
                resolve({ code: 400, message: 'Channel closed', details: [] });
            }
            this.pendingRequestResolveMap.clear();
        };
        this.channel.onopen = () => {
            var _a;
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Media stats channel: opened');
        };
    }
    onMediaStatsMessage(message) {
        const data = JSON.parse(message.data);
        if (data.response) {
            this.onMediaStatsResponse(data.response);
        }
        if (data.resources) {
            this.onMediaStatsResources(data.resources);
        }
    }
    onMediaStatsResponse(response) {
        var _a;
        (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Media stats channel: response received', response);
        const resolve = this.pendingRequestResolveMap.get(response.requestId);
        if (resolve) {
            resolve(response.status);
            this.pendingRequestResolveMap.delete(response.requestId);
        }
    }
    onMediaStatsResources(resources) {
        var _a, _b;
        // We expect only one resource to be sent.
        if (resources.length > 1) {
            resources.forEach((resource) => {
                var _a;
                (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.ERRORS, 'Media stats channel: more than one resource received', resource);
            });
        }
        const resource = resources[0];
        (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Media stats channel: resource received', resource);
        if (resource.configuration) {
            for (const [key, value] of Object.entries(resource.configuration.allowlist)) {
                this.allowlist.set(key, value.keys);
            }
            // We want to stop the interval if the upload interval is zero
            if (this.intervalId &&
                resource.configuration.uploadIntervalSeconds === 0) {
                clearInterval(this.intervalId);
                this.intervalId = 0;
            }
            // We want to start the interval if the upload interval is not zero.
            if (resource.configuration.uploadIntervalSeconds) {
                // We want to reset the interval if the upload interval has changed.
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                }
                this.intervalId = setInterval(this.sendMediaStats.bind(this), resource.configuration.uploadIntervalSeconds * 1000);
            }
        }
        else {
            (_b = this.channelLogger) === null || _b === void 0 ? void 0 : _b.log(enums_1.LogLevel.ERRORS, 'Media stats channel: resource received without configuration');
        }
    }
    sendMediaStats() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const stats = yield this.peerConnection.getStats();
            const requestStats = [];
            stats.forEach((report) => {
                const statsType = report.type;
                if (statsType && this.allowlist.has(report.type)) {
                    const filteredMediaStats = {};
                    Object.entries(report).forEach((entry) => {
                        var _a;
                        // id is not accepted with other stats. It is populated in the top
                        // level section.
                        if (((_a = this.allowlist.get(report.type)) === null || _a === void 0 ? void 0 : _a.includes(entry[0])) &&
                            entry[0] !== 'id') {
                            // We want to convert the camel case to underscore.
                            filteredMediaStats[this.camelToUnderscore(entry[0])] = entry[1];
                        }
                    });
                    const filteredMediaStatsDictionary = {
                        'id': report.id,
                        [STATS_TYPE_CONVERTER[report.type]]: filteredMediaStats,
                    };
                    const filteredStatsSectionData = filteredMediaStatsDictionary;
                    requestStats.push(filteredStatsSectionData);
                }
            });
            if (!requestStats.length) {
                (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.ERRORS, 'Media stats channel: no media stats to send');
                return { code: 400, message: 'No media stats to send', details: [] };
            }
            if (this.channel.readyState === 'open') {
                const mediaStatsRequest = {
                    requestId: this.requestId,
                    uploadMediaStats: { sections: requestStats },
                };
                const request = {
                    request: mediaStatsRequest,
                };
                (_b = this.channelLogger) === null || _b === void 0 ? void 0 : _b.log(enums_1.LogLevel.MESSAGES, 'Media stats channel: sending request', mediaStatsRequest);
                try {
                    this.channel.send(JSON.stringify(request));
                }
                catch (e) {
                    (_c = this.channelLogger) === null || _c === void 0 ? void 0 : _c.log(enums_1.LogLevel.ERRORS, 'Media stats channel: Failed to send request with error', e);
                    throw e;
                }
                this.requestId++;
                const requestPromise = new Promise((resolve) => {
                    this.pendingRequestResolveMap.set(mediaStatsRequest.requestId, resolve);
                });
                return requestPromise;
            }
            else {
                clearInterval(this.intervalId);
                this.intervalId = 0;
                (_d = this.channelLogger) === null || _d === void 0 ? void 0 : _d.log(enums_1.LogLevel.ERRORS, 'Media stats channel: handler tried to send message when channel was closed');
                return { code: 400, message: 'Channel is not open', details: [] };
            }
        });
    }
    camelToUnderscore(text) {
        return text.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
}
exports.MediaStatsChannelHandler = MediaStatsChannelHandler;


/***/ },

/***/ "../internal/channel_handlers/participants_channel_handler.ts"
/*!********************************************************************!*\
  !*** ../internal/channel_handlers/participants_channel_handler.ts ***!
  \********************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ParticipantsChannelHandler = void 0;
const enums_1 = __webpack_require__(/*! ../../types/enums */ "../types/enums.ts");
const subscribable_impl_1 = __webpack_require__(/*! ../subscribable_impl */ "../internal/subscribable_impl.ts");
/**
 * Handler for participants channel
 */
class ParticipantsChannelHandler {
    constructor(channel, participantsDelegate, idParticipantMap = new Map(), nameParticipantMap = new Map(), internalParticipantMap = new Map(), internalMediaEntryMap = new Map(), channelLogger) {
        this.channel = channel;
        this.participantsDelegate = participantsDelegate;
        this.idParticipantMap = idParticipantMap;
        this.nameParticipantMap = nameParticipantMap;
        this.internalParticipantMap = internalParticipantMap;
        this.internalMediaEntryMap = internalMediaEntryMap;
        this.channelLogger = channelLogger;
        this.channel.onmessage = (event) => {
            this.onParticipantsMessage(event);
        };
        this.channel.onopen = () => {
            this.onParticipantsOpened();
        };
        this.channel.onclose = () => {
            this.onParticipantsClosed();
        };
    }
    onParticipantsOpened() {
        var _a;
        (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Participants channel: opened');
    }
    onParticipantsMessage(event) {
        var _a, _b, _c, _d;
        const data = JSON.parse(event.data);
        let participants = this.participantsDelegate.get();
        (_a = data.deletedResources) === null || _a === void 0 ? void 0 : _a.forEach((deletedResource) => {
            var _a;
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.RESOURCES, 'Participants channel: deleted resource', deletedResource);
            const participant = this.idParticipantMap.get(deletedResource.id);
            if (!participant) {
                return;
            }
            this.idParticipantMap.delete(deletedResource.id);
            const deletedParticipant = this.internalParticipantMap.get(participant);
            if (!deletedParticipant) {
                return;
            }
            deletedParticipant.ids.delete(deletedResource.id);
            if (deletedParticipant.ids.size !== 0) {
                return;
            }
            if (participant.participant.name) {
                this.nameParticipantMap.delete(participant.participant.name);
            }
            participants = participants.filter((p) => p !== participant);
            this.internalParticipantMap.delete(participant);
            deletedParticipant.mediaEntries.get().forEach((mediaEntry) => {
                const internalMediaEntry = this.internalMediaEntryMap.get(mediaEntry);
                if (internalMediaEntry) {
                    internalMediaEntry.participant.set(undefined);
                }
            });
        });
        const addedParticipants = [];
        (_b = data.resources) === null || _b === void 0 ? void 0 : _b.forEach((resource) => {
            var _a, _b, _c, _d;
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.RESOURCES, 'Participants channel: added resource', resource);
            if (!resource.id) {
                // We expect all participants to have an id. If not, we log an error
                // and ignore the participant.
                (_b = this.channelLogger) === null || _b === void 0 ? void 0 : _b.log(enums_1.LogLevel.ERRORS, 'Participants channel: participant resource has no id', resource);
                return;
            }
            // We do not expect that the participant resource already exists.
            // However, it is possible that the media entries channel references it
            // before we receive the participant resource. In this case, we update
            // the participant resource with the type and maintain the media entry
            // relationship.
            let existingMediaEntriesDelegate;
            let existingParticipant;
            let existingIds;
            if (this.idParticipantMap.has(resource.id)) {
                existingParticipant = this.idParticipantMap.get(resource.id);
            }
            else if (resource.participant.name &&
                this.nameParticipantMap.has(resource.participant.name)) {
                existingParticipant = this.nameParticipantMap.get(resource.participant.name);
            }
            else if (resource.participant.participantKey) {
                existingParticipant = (_c = Array.from(this.internalParticipantMap.entries()).find(([participant, _]) => participant.participant.participantKey ===
                    resource.participant.participantKey)) === null || _c === void 0 ? void 0 : _c[0];
            }
            if (existingParticipant) {
                const internalParticipant = this.internalParticipantMap.get(existingParticipant);
                if (internalParticipant) {
                    existingMediaEntriesDelegate = internalParticipant.mediaEntries;
                    // (TODO: Remove this once we are using participant
                    // names as identifiers. Right now, it is possible for a participant to
                    // have multiple ids due to updates being treated as new resources.
                    existingIds = internalParticipant.ids;
                    existingIds.forEach((id) => {
                        this.idParticipantMap.delete(id);
                    });
                }
                if (existingParticipant.participant.name) {
                    this.nameParticipantMap.delete(existingParticipant.participant.name);
                }
                this.internalParticipantMap.delete(existingParticipant);
                participants = participants.filter((p) => p !== existingParticipant);
                (_d = this.channelLogger) === null || _d === void 0 ? void 0 : _d.log(enums_1.LogLevel.ERRORS, 'Participants channel: participant resource already exists', resource);
            }
            const participantElement = createParticipant(resource, existingMediaEntriesDelegate, existingIds);
            const participant = participantElement.participant;
            const internalParticipant = participantElement.internalParticipant;
            participantElement.internalParticipant.ids.forEach((id) => {
                this.idParticipantMap.set(id, participant);
            });
            if (resource.participant.name) {
                this.nameParticipantMap.set(resource.participant.name, participant);
            }
            this.internalParticipantMap.set(participant, internalParticipant);
            addedParticipants.push(participant);
        });
        // Update participant collection.
        if (((_c = data.resources) === null || _c === void 0 ? void 0 : _c.length) || ((_d = data.deletedResources) === null || _d === void 0 ? void 0 : _d.length)) {
            const newParticipants = [...participants, ...addedParticipants];
            this.participantsDelegate.set(newParticipants);
        }
    }
    onParticipantsClosed() {
        var _a;
        (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Participants channel: closed');
    }
}
exports.ParticipantsChannelHandler = ParticipantsChannelHandler;
/**
 * Creates a new participant.
 * @return The new participant and its internal representation.
 */
function createParticipant(resource, mediaEntriesDelegate = new subscribable_impl_1.SubscribableDelegate([]), existingIds = new Set()) {
    var _a;
    if (!resource.id) {
        throw new Error('Participant resource must have an id');
    }
    const participant = {
        participant: resource.participant,
        mediaEntries: mediaEntriesDelegate.getSubscribable(),
    };
    existingIds.add(resource.id);
    const internalParticipant = {
        name: (_a = resource.participant.name) !== null && _a !== void 0 ? _a : '',
        ids: existingIds,
        mediaEntries: mediaEntriesDelegate,
    };
    return {
        participant,
        internalParticipant,
    };
}


/***/ },

/***/ "../internal/channel_handlers/session_control_channel_handler.ts"
/*!***********************************************************************!*\
  !*** ../internal/channel_handlers/session_control_channel_handler.ts ***!
  \***********************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SessionControlChannelHandler = void 0;
const enums_1 = __webpack_require__(/*! ../../types/enums */ "../types/enums.ts");
const DISCONNECT_REASON_MAP = new Map([
    ['REASON_CLIENT_LEFT', enums_1.MeetDisconnectReason.CLIENT_LEFT],
    ['REASON_USER_STOPPED', enums_1.MeetDisconnectReason.USER_STOPPED],
    ['REASON_CONFERENCE_ENDED', enums_1.MeetDisconnectReason.CONFERENCE_ENDED],
    ['REASON_SESSION_UNHEALTHY', enums_1.MeetDisconnectReason.SESSION_UNHEALTHY],
]);
/**
 * Helper class to handles the session control channel.
 */
class SessionControlChannelHandler {
    constructor(channel, sessionStatusDelegate, channelLogger) {
        this.channel = channel;
        this.sessionStatusDelegate = sessionStatusDelegate;
        this.channelLogger = channelLogger;
        this.requestId = 1;
        this.channel.onmessage = (event) => {
            this.onSessionControlMessage(event);
        };
        this.channel.onopen = () => {
            this.onSessionControlOpened();
        };
        this.channel.onclose = () => {
            this.onSessionControlClosed();
        };
    }
    onSessionControlOpened() {
        var _a;
        (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Session control channel: opened');
        this.sessionStatusDelegate.set({
            connectionState: enums_1.MeetConnectionState.WAITING,
        });
    }
    onSessionControlMessage(event) {
        var _a, _b, _c, _d;
        const message = event.data;
        const json = JSON.parse(message);
        if (json === null || json === void 0 ? void 0 : json.response) {
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Session control channel: response recieved', json.response);
            (_b = this.leaveSessionPromise) === null || _b === void 0 ? void 0 : _b.call(this);
        }
        if ((json === null || json === void 0 ? void 0 : json.resources) && json.resources.length > 0) {
            const sessionStatus = json.resources[0].sessionStatus;
            (_c = this.channelLogger) === null || _c === void 0 ? void 0 : _c.log(enums_1.LogLevel.RESOURCES, 'Session control channel: resource recieved', json.resources[0]);
            if (sessionStatus.connectionState === 'STATE_WAITING') {
                this.sessionStatusDelegate.set({
                    connectionState: enums_1.MeetConnectionState.WAITING,
                });
            }
            else if (sessionStatus.connectionState === 'STATE_JOINED') {
                this.sessionStatusDelegate.set({
                    connectionState: enums_1.MeetConnectionState.JOINED,
                });
            }
            else if (sessionStatus.connectionState === 'STATE_DISCONNECTED') {
                this.sessionStatusDelegate.set({
                    connectionState: enums_1.MeetConnectionState.DISCONNECTED,
                    disconnectReason: (_d = DISCONNECT_REASON_MAP.get(sessionStatus.disconnectReason || '')) !== null && _d !== void 0 ? _d : enums_1.MeetDisconnectReason.SESSION_UNHEALTHY,
                });
            }
        }
    }
    onSessionControlClosed() {
        var _a, _b;
        // If the channel is closed, we should resolve the leave session promise.
        (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Session control channel: closed');
        (_b = this.leaveSessionPromise) === null || _b === void 0 ? void 0 : _b.call(this);
        if (this.sessionStatusDelegate.get().connectionState !==
            enums_1.MeetConnectionState.DISCONNECTED) {
            this.sessionStatusDelegate.set({
                connectionState: enums_1.MeetConnectionState.DISCONNECTED,
                disconnectReason: enums_1.MeetDisconnectReason.UNKNOWN,
            });
        }
    }
    leaveSession() {
        var _a, _b;
        (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Session control channel: leave session request sent');
        try {
            this.channel.send(JSON.stringify({
                request: {
                    requestId: this.requestId++,
                    leave: {},
                },
            }));
        }
        catch (e) {
            (_b = this.channelLogger) === null || _b === void 0 ? void 0 : _b.log(enums_1.LogLevel.ERRORS, 'Session control channel: Failed to send leave request with error', e);
            throw e;
        }
        return new Promise((resolve) => {
            this.leaveSessionPromise = resolve;
        });
    }
}
exports.SessionControlChannelHandler = SessionControlChannelHandler;


/***/ },

/***/ "../internal/channel_handlers/video_assignment_channel_handler.ts"
/*!************************************************************************!*\
  !*** ../internal/channel_handlers/video_assignment_channel_handler.ts ***!
  \************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VideoAssignmentChannelHandler = void 0;
const enums_1 = __webpack_require__(/*! ../../types/enums */ "../types/enums.ts");
const utils_1 = __webpack_require__(/*! ../utils */ "../internal/utils.ts");
// We request the highest possible resolution by default.
const MAX_RESOLUTION = {
    height: 1080,
    width: 1920,
    frameRate: 30,
};
/**
 * Helper class to handle the video assignment channel.
 */
class VideoAssignmentChannelHandler {
    constructor(channel, idMediaEntryMap, internalMediaEntryMap = new Map(), idMediaLayoutMap = new Map(), internalMediaLayoutMap = new Map(), mediaEntriesDelegate, internalMeetStreamTrackMap = new Map(), channelLogger) {
        this.channel = channel;
        this.idMediaEntryMap = idMediaEntryMap;
        this.internalMediaEntryMap = internalMediaEntryMap;
        this.idMediaLayoutMap = idMediaLayoutMap;
        this.internalMediaLayoutMap = internalMediaLayoutMap;
        this.mediaEntriesDelegate = mediaEntriesDelegate;
        this.internalMeetStreamTrackMap = internalMeetStreamTrackMap;
        this.channelLogger = channelLogger;
        this.requestId = 1;
        this.mediaLayoutLabelMap = new Map();
        this.pendingRequestResolveMap = new Map();
        this.channel.onmessage = (event) => {
            this.onVideoAssignmentMessage(event);
        };
        this.channel.onclose = () => {
            var _a;
            // Resolve all pending requests with an error.
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Video assignment channel: closed');
            for (const [, resolve] of this.pendingRequestResolveMap) {
                resolve({ code: 400, message: 'Channel closed', details: [] });
            }
            this.pendingRequestResolveMap.clear();
        };
        this.channel.onopen = () => {
            var _a;
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Video assignment channel: opened');
        };
    }
    onVideoAssignmentMessage(message) {
        const data = JSON.parse(message.data);
        if (data.response) {
            this.onVideoAssignmentResponse(data.response);
        }
        if (data.resources) {
            this.onVideoAssignmentResources(data.resources);
        }
    }
    onVideoAssignmentResponse(response) {
        var _a, _b;
        // Users should listen on the video assignment channel for actual video
        // assignments. These responses signify that the request was expected.
        (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Video assignment channel: recieved response', response);
        (_b = this.pendingRequestResolveMap.get(response.requestId)) === null || _b === void 0 ? void 0 : _b(response.status);
    }
    onVideoAssignmentResources(resources) {
        resources.forEach((resource) => {
            var _a;
            (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.RESOURCES, 'Video assignment channel: resource added', resource);
            if (resource.videoAssignment.canvases) {
                this.onVideoAssignment(resource);
            }
        });
    }
    onVideoAssignment(videoAssignment) {
        const canvases = videoAssignment.videoAssignment.canvases;
        canvases.forEach((canvas) => {
            var _a, _b, _c, _d, _e, _f;
            const mediaLayout = this.idMediaLayoutMap.get(canvas.canvasId);
            // We expect that the media layout is already created.
            let internalMediaEntry;
            if (mediaLayout) {
                const assignedMediaEntry = mediaLayout.mediaEntry.get();
                let mediaEntry;
                // if association already exists, we need to either update the video
                // ssrc or remove the association if the ids don't match.
                if (assignedMediaEntry &&
                    ((_a = this.internalMediaEntryMap.get(assignedMediaEntry)) === null || _a === void 0 ? void 0 : _a.id) ===
                        canvas.mediaEntryId) {
                    // We expect the internal media entry to be already created if the media entry exists.
                    internalMediaEntry =
                        this.internalMediaEntryMap.get(assignedMediaEntry);
                    // If the media canvas is already associated with a media entry, we
                    // need to update the video ssrc.
                    // Expect the media entry to be created, without assertion, TS
                    // complains it can be undefined.
                    // tslint:disable:no-unnecessary-type-assertion
                    internalMediaEntry.videoSsrc = canvas.ssrc;
                    mediaEntry = assignedMediaEntry;
                }
                else {
                    // If asssocation does not exist, we will attempt to retreive the
                    // media entry from the map.
                    const existingMediaEntry = this.idMediaEntryMap.get(canvas.mediaEntryId);
                    // Clear existing association if it exists.
                    if (assignedMediaEntry) {
                        (_b = this.internalMediaEntryMap
                            .get(assignedMediaEntry)) === null || _b === void 0 ? void 0 : _b.mediaLayout.set(undefined);
                        (_c = this.internalMediaLayoutMap
                            .get(mediaLayout)) === null || _c === void 0 ? void 0 : _c.mediaEntry.set(undefined);
                    }
                    if (existingMediaEntry) {
                        // If the media entry exists, need to create the media canvas association.
                        internalMediaEntry =
                            this.internalMediaEntryMap.get(existingMediaEntry);
                        internalMediaEntry.videoSsrc = canvas.ssrc;
                        internalMediaEntry.mediaLayout.set(mediaLayout);
                        mediaEntry = existingMediaEntry;
                    }
                    else {
                        // If the media entry doewsn't exist, we need to create it and
                        // then create the media canvas association.
                        // We don't expect to hit this expression, but since data channels
                        // don't guarantee order, we do this to be safe.
                        const mediaEntryElement = (0, utils_1.createMediaEntry)({
                            id: canvas.mediaEntryId,
                            mediaLayout,
                            videoSsrc: canvas.ssrc,
                        });
                        this.internalMediaEntryMap.set(mediaEntryElement.mediaEntry, mediaEntryElement.internalMediaEntry);
                        internalMediaEntry = mediaEntryElement.internalMediaEntry;
                        const newMediaEntry = mediaEntryElement.mediaEntry;
                        this.idMediaEntryMap.set(canvas.mediaEntryId, newMediaEntry);
                        const newMediaEntries = [
                            ...this.mediaEntriesDelegate.get(),
                            newMediaEntry,
                        ];
                        this.mediaEntriesDelegate.set(newMediaEntries);
                        mediaEntry = newMediaEntry;
                    }
                    (_d = this.internalMediaLayoutMap
                        .get(mediaLayout)) === null || _d === void 0 ? void 0 : _d.mediaEntry.set(mediaEntry);
                    (_e = this.internalMediaEntryMap
                        .get(mediaEntry)) === null || _e === void 0 ? void 0 : _e.mediaLayout.set(mediaLayout);
                }
                if (!this.isMediaEntryAssignedToMeetStreamTrack(mediaEntry, internalMediaEntry)) {
                    this.assignVideoMeetStreamTrack(mediaEntry);
                }
            }
            // tslint:enable:no-unnecessary-type-assertion
            (_f = this.channelLogger) === null || _f === void 0 ? void 0 : _f.log(enums_1.LogLevel.ERRORS, 'Video assignment channel: server sent a canvas that was not created by the client');
        });
    }
    sendRequests(mediaLayoutRequests) {
        var _a, _b;
        const label = Date.now().toString();
        const canvases = [];
        mediaLayoutRequests.forEach((request) => {
            this.mediaLayoutLabelMap.set(request.mediaLayout, label);
            canvases.push({
                id: this.internalMediaLayoutMap.get(request.mediaLayout).id,
                dimensions: request.mediaLayout.canvasDimensions,
                relevant: {},
            });
        });
        const request = {
            requestId: this.requestId++,
            setAssignment: {
                layoutModel: {
                    label,
                    canvases,
                },
                maxVideoResolution: MAX_RESOLUTION,
            },
        };
        (_a = this.channelLogger) === null || _a === void 0 ? void 0 : _a.log(enums_1.LogLevel.MESSAGES, 'Video Assignment channel: Sending request', request);
        try {
            this.channel.send(JSON.stringify({
                request,
            }));
        }
        catch (e) {
            (_b = this.channelLogger) === null || _b === void 0 ? void 0 : _b.log(enums_1.LogLevel.ERRORS, 'Video Assignment channel: Failed to send request with error', e);
            throw e;
        }
        const requestPromise = new Promise((resolve) => {
            this.pendingRequestResolveMap.set(request.requestId, resolve);
        });
        return requestPromise;
    }
    isMediaEntryAssignedToMeetStreamTrack(mediaEntry, internalMediaEntry) {
        const videoMeetStreamTrack = mediaEntry.videoMeetStreamTrack.get();
        if (!videoMeetStreamTrack)
            return false;
        const internalMeetStreamTrack = this.internalMeetStreamTrackMap.get(videoMeetStreamTrack);
        if (internalMeetStreamTrack.videoSsrc === internalMediaEntry.videoSsrc) {
            return true;
        }
        else {
            // ssrcs can change, if the video ssrc is not the same, we need to remove
            // the relationship between the media entry and the meet stream track.
            internalMediaEntry.videoMeetStreamTrack.set(undefined);
            internalMeetStreamTrack === null || internalMeetStreamTrack === void 0 ? void 0 : internalMeetStreamTrack.mediaEntry.set(undefined);
            return false;
        }
    }
    assignVideoMeetStreamTrack(mediaEntry) {
        for (const [meetStreamTrack, internalMeetStreamTrack] of this
            .internalMeetStreamTrackMap) {
            if (meetStreamTrack.mediaStreamTrack.kind === 'video') {
                internalMeetStreamTrack.maybeAssignMediaEntryOnFrame(mediaEntry, 'video');
            }
        }
    }
}
exports.VideoAssignmentChannelHandler = VideoAssignmentChannelHandler;


/***/ },

/***/ "../internal/communication_protocols/default_communication_protocol_impl.ts"
/*!**********************************************************************************!*\
  !*** ../internal/communication_protocols/default_communication_protocol_impl.ts ***!
  \**********************************************************************************/
(__unused_webpack_module, exports) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DefaultCommunicationProtocolImpl = void 0;
const MEET_API_URL = 'https://meet.googleapis.com/v2beta/';
/**
 * The HTTP communication protocol for communication with Meet API.
 */
class DefaultCommunicationProtocolImpl {
    constructor(requiredConfiguration, meetApiUrl = MEET_API_URL) {
        this.requiredConfiguration = requiredConfiguration;
        this.meetApiUrl = meetApiUrl;
    }
    connectActiveConference(sdpOffer) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Call to Meet API
            const connectUrl = `${this.meetApiUrl}${this.requiredConfiguration.meetingSpaceId}:connectActiveConference`;
            const response = yield fetch(connectUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.requiredConfiguration.accessToken}`,
                },
                body: JSON.stringify({
                    'offer': sdpOffer,
                }),
            });
            if (!response.ok) {
                const bodyReader = (_a = response.body) === null || _a === void 0 ? void 0 : _a.getReader();
                let error = '';
                if (bodyReader) {
                    const decoder = new TextDecoder();
                    let readingDone = false;
                    while (!readingDone) {
                        const { done, value } = yield (bodyReader === null || bodyReader === void 0 ? void 0 : bodyReader.read());
                        if (done) {
                            readingDone = true;
                            break;
                        }
                        error += decoder.decode(value);
                    }
                }
                const errorJson = JSON.parse(error);
                throw new Error(`${JSON.stringify(errorJson, null, 2)}`);
            }
            const payload = yield response.json();
            return { answer: payload['answer'] };
        });
    }
}
exports.DefaultCommunicationProtocolImpl = DefaultCommunicationProtocolImpl;


/***/ },

/***/ "../internal/internal_meet_stream_track_impl.ts"
/*!******************************************************!*\
  !*** ../internal/internal_meet_stream_track_impl.ts ***!
  \******************************************************/
(__unused_webpack_module, exports) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InternalMeetStreamTrackImpl = void 0;
/**
 * Implementation of InternalMeetStreamTrack.
 */
class InternalMeetStreamTrackImpl {
    constructor(receiver, mediaEntry, meetStreamTrack, internalMediaEntryMap) {
        this.receiver = receiver;
        this.mediaEntry = mediaEntry;
        this.meetStreamTrack = meetStreamTrack;
        this.internalMediaEntryMap = internalMediaEntryMap;
        const mediaStreamTrack = meetStreamTrack.mediaStreamTrack;
        let mediaStreamTrackProcessor;
        if (mediaStreamTrack.kind === 'audio') {
            mediaStreamTrackProcessor = new MediaStreamTrackProcessor({
                track: mediaStreamTrack,
            });
        }
        else {
            mediaStreamTrackProcessor = new MediaStreamTrackProcessor({
                track: mediaStreamTrack,
            });
        }
        this.reader = mediaStreamTrackProcessor.readable.getReader();
    }
    maybeAssignMediaEntryOnFrame(mediaEntry, kind) {
        return __awaiter(this, void 0, void 0, function* () {
            // Only want to check the media entry if it has the correct csrc type
            // for this meet stream track.
            if (!this.mediaStreamTrackSrcPresent(mediaEntry) ||
                this.meetStreamTrack.mediaStreamTrack.kind !== kind) {
                return;
            }
            // Loop through the frames until media entry is assigned by either this
            // meet stream track or another meet stream track.
            while (!this.mediaEntryTrackAssigned(mediaEntry, kind)) {
                const frame = yield this.reader.read();
                if (frame.done)
                    break;
                if (kind === 'audio') {
                    yield this.onAudioFrame(mediaEntry);
                }
                else if (kind === 'video') {
                    this.onVideoFrame(mediaEntry);
                }
                frame.value.close();
            }
            return;
        });
    }
    onAudioFrame(mediaEntry) {
        return __awaiter(this, void 0, void 0, function* () {
            const internalMediaEntry = this.internalMediaEntryMap.get(mediaEntry);
            const contributingSources = this.receiver.getContributingSources();
            for (const contributingSource of contributingSources) {
                if (contributingSource.source === internalMediaEntry.audioCsrc) {
                    internalMediaEntry.audioMeetStreamTrack.set(this.meetStreamTrack);
                    this.mediaEntry.set(mediaEntry);
                }
            }
        });
    }
    onVideoFrame(mediaEntry) {
        const internalMediaEntry = this.internalMediaEntryMap.get(mediaEntry);
        const synchronizationSources = this.receiver.getSynchronizationSources();
        for (const syncSource of synchronizationSources) {
            if (syncSource.source === internalMediaEntry.videoSsrc) {
                this.videoSsrc = syncSource.source;
                internalMediaEntry.videoMeetStreamTrack.set(this.meetStreamTrack);
                this.mediaEntry.set(mediaEntry);
            }
        }
        return;
    }
    mediaEntryTrackAssigned(mediaEntry, kind) {
        if ((kind === 'audio' && mediaEntry.audioMeetStreamTrack.get()) ||
            (kind === 'video' && mediaEntry.videoMeetStreamTrack.get())) {
            return true;
        }
        return false;
    }
    mediaStreamTrackSrcPresent(mediaEntry) {
        const internalMediaEntry = this.internalMediaEntryMap.get(mediaEntry);
        if (this.meetStreamTrack.mediaStreamTrack.kind === 'audio') {
            return !!(internalMediaEntry === null || internalMediaEntry === void 0 ? void 0 : internalMediaEntry.audioCsrc);
        }
        else if (this.meetStreamTrack.mediaStreamTrack.kind === 'video') {
            return !!(internalMediaEntry === null || internalMediaEntry === void 0 ? void 0 : internalMediaEntry.videoSsrc);
        }
        return false;
    }
}
exports.InternalMeetStreamTrackImpl = InternalMeetStreamTrackImpl;


/***/ },

/***/ "../internal/meet_stream_track_impl.ts"
/*!*********************************************!*\
  !*** ../internal/meet_stream_track_impl.ts ***!
  \*********************************************/
(__unused_webpack_module, exports) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MeetStreamTrackImpl = void 0;
/**
 * The implementation of MeetStreamTrack.
 */
class MeetStreamTrackImpl {
    constructor(mediaStreamTrack, mediaEntryDelegate) {
        this.mediaStreamTrack = mediaStreamTrack;
        this.mediaEntryDelegate = mediaEntryDelegate;
        this.mediaEntry = this.mediaEntryDelegate.getSubscribable();
    }
}
exports.MeetStreamTrackImpl = MeetStreamTrackImpl;


/***/ },

/***/ "../internal/meetmediaapiclient_impl.ts"
/*!**********************************************!*\
  !*** ../internal/meetmediaapiclient_impl.ts ***!
  \**********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MeetMediaApiClientImpl = void 0;
const enums_1 = __webpack_require__(/*! ../types/enums */ "../types/enums.ts");
const channel_logger_1 = __webpack_require__(/*! ./channel_handlers/channel_logger */ "../internal/channel_handlers/channel_logger.ts");
const media_entries_channel_handler_1 = __webpack_require__(/*! ./channel_handlers/media_entries_channel_handler */ "../internal/channel_handlers/media_entries_channel_handler.ts");
const media_stats_channel_handler_1 = __webpack_require__(/*! ./channel_handlers/media_stats_channel_handler */ "../internal/channel_handlers/media_stats_channel_handler.ts");
const participants_channel_handler_1 = __webpack_require__(/*! ./channel_handlers/participants_channel_handler */ "../internal/channel_handlers/participants_channel_handler.ts");
const session_control_channel_handler_1 = __webpack_require__(/*! ./channel_handlers/session_control_channel_handler */ "../internal/channel_handlers/session_control_channel_handler.ts");
const video_assignment_channel_handler_1 = __webpack_require__(/*! ./channel_handlers/video_assignment_channel_handler */ "../internal/channel_handlers/video_assignment_channel_handler.ts");
const default_communication_protocol_impl_1 = __webpack_require__(/*! ./communication_protocols/default_communication_protocol_impl */ "../internal/communication_protocols/default_communication_protocol_impl.ts");
const internal_meet_stream_track_impl_1 = __webpack_require__(/*! ./internal_meet_stream_track_impl */ "../internal/internal_meet_stream_track_impl.ts");
const meet_stream_track_impl_1 = __webpack_require__(/*! ./meet_stream_track_impl */ "../internal/meet_stream_track_impl.ts");
const subscribable_impl_1 = __webpack_require__(/*! ./subscribable_impl */ "../internal/subscribable_impl.ts");
// Meet only supports 3 audio virtual ssrcs. If disabled, there will be no
// audio.
const NUMBER_OF_AUDIO_VIRTUAL_SSRC = 3;
const MINIMUM_VIDEO_STREAMS = 0;
const MAXIMUM_VIDEO_STREAMS = 3;
/**
 * Implementation of MeetMediaApiClient.
 */
class MeetMediaApiClientImpl {
    constructor(requiredConfiguration) {
        this.requiredConfiguration = requiredConfiguration;
        /* tslint:enable:no-unused-variable */
        this.mediaLayoutId = 1;
        // Media layout retrieval by id. Needed by the video assignment channel handler
        // to update the media layout.
        this.idMediaLayoutMap = new Map();
        // Used to update media layouts.
        this.internalMediaLayoutMap = new Map();
        // Media entry retrieval by id. Needed by the video assignment channel handler
        // to update the media entry.
        this.idMediaEntryMap = new Map();
        // Used to update media entries.
        this.internalMediaEntryMap = new Map();
        // Used to update meet stream tracks.
        this.internalMeetStreamTrackMap = new Map();
        this.idParticipantMap = new Map();
        this.nameParticipantMap = new Map();
        this.internalParticipantMap = new Map();
        this.validateConfiguration();
        this.sessionStatusDelegate = new subscribable_impl_1.SubscribableDelegate({
            connectionState: enums_1.MeetConnectionState.UNKNOWN,
        });
        this.sessionStatus = this.sessionStatusDelegate.getSubscribable();
        this.meetStreamTracksDelegate = new subscribable_impl_1.SubscribableDelegate([]);
        this.meetStreamTracks = this.meetStreamTracksDelegate.getSubscribable();
        this.mediaEntriesDelegate = new subscribable_impl_1.SubscribableDelegate([]);
        this.mediaEntries = this.mediaEntriesDelegate.getSubscribable();
        this.participantsDelegate = new subscribable_impl_1.SubscribableDelegate([]);
        this.participants = this.participantsDelegate.getSubscribable();
        this.presenterDelegate = new subscribable_impl_1.SubscribableDelegate(undefined);
        this.presenter = this.presenterDelegate.getSubscribable();
        this.screenshareDelegate = new subscribable_impl_1.SubscribableDelegate(undefined);
        this.screenshare = this.screenshareDelegate.getSubscribable();
        const configuration = {
            sdpSemantics: 'unified-plan',
            bundlePolicy: 'max-bundle',
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        };
        // Create peer connection
        this.peerConnection = new RTCPeerConnection(configuration);
        this.peerConnection.ontrack = (e) => {
            if (e.track) {
                this.createMeetStreamTrack(e.track, e.receiver);
            }
        };
    }
    validateConfiguration() {
        if (this.requiredConfiguration.numberOfVideoStreams < MINIMUM_VIDEO_STREAMS ||
            this.requiredConfiguration.numberOfVideoStreams > MAXIMUM_VIDEO_STREAMS) {
            throw new Error(`Unsupported number of video streams, must be between ${MINIMUM_VIDEO_STREAMS} and ${MAXIMUM_VIDEO_STREAMS}`);
        }
    }
    createMeetStreamTrack(mediaStreamTrack, receiver) {
        const meetStreamTracks = this.meetStreamTracks.get();
        const mediaEntryDelegate = new subscribable_impl_1.SubscribableDelegate(undefined);
        const meetStreamTrack = new meet_stream_track_impl_1.MeetStreamTrackImpl(mediaStreamTrack, mediaEntryDelegate);
        const internalMeetStreamTrack = new internal_meet_stream_track_impl_1.InternalMeetStreamTrackImpl(receiver, mediaEntryDelegate, meetStreamTrack, this.internalMediaEntryMap);
        const newStreamTrackArray = [...meetStreamTracks, meetStreamTrack];
        this.internalMeetStreamTrackMap.set(meetStreamTrack, internalMeetStreamTrack);
        this.meetStreamTracksDelegate.set(newStreamTrackArray);
    }
    joinMeeting(communicationProtocol) {
        return __awaiter(this, void 0, void 0, function* () {
            // The offer must be in the order of audio, datachannels, video.
            var _a, _b, _c, _d, _e, _f;
            // Create audio transceivers based on initial config.
            if (this.requiredConfiguration.enableAudioStreams) {
                for (let i = 0; i < NUMBER_OF_AUDIO_VIRTUAL_SSRC; i++) {
                    // Integrating clients must support and negotiate the OPUS codec in
                    // the SDP offer.
                    // This is the default for WebRTC.
                    // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/WebRTC_codecs.
                    this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });
                }
            }
            // ---- UTILITY DATA CHANNELS -----
            // All data channels must be reliable and ordered.
            const dataChannelConfig = {
                ordered: true,
                reliable: true,
            };
            // Always create the session and media stats control channel.
            this.sessionControlChannel = this.peerConnection.createDataChannel('session-control', dataChannelConfig);
            let sessionControlchannelLogger;
            if ((_a = this.requiredConfiguration) === null || _a === void 0 ? void 0 : _a.logsCallback) {
                sessionControlchannelLogger = new channel_logger_1.ChannelLogger('session-control', this.requiredConfiguration.logsCallback);
            }
            this.sessionControlChannelHandler = new session_control_channel_handler_1.SessionControlChannelHandler(this.sessionControlChannel, this.sessionStatusDelegate, sessionControlchannelLogger);
            this.mediaStatsChannel = this.peerConnection.createDataChannel('media-stats', dataChannelConfig);
            let mediaStatsChannelLogger;
            if ((_b = this.requiredConfiguration) === null || _b === void 0 ? void 0 : _b.logsCallback) {
                mediaStatsChannelLogger = new channel_logger_1.ChannelLogger('media-stats', this.requiredConfiguration.logsCallback);
            }
            this.mediaStatsChannelHandler = new media_stats_channel_handler_1.MediaStatsChannelHandler(this.mediaStatsChannel, this.peerConnection, mediaStatsChannelLogger);
            // ---- CONDITIONAL DATA CHANNELS -----
            // We only need the video assignment channel if we are requesting video.
            if (this.requiredConfiguration.numberOfVideoStreams > 0) {
                this.videoAssignmentChannel = this.peerConnection.createDataChannel('video-assignment', dataChannelConfig);
                let videoAssignmentChannelLogger;
                if ((_c = this.requiredConfiguration) === null || _c === void 0 ? void 0 : _c.logsCallback) {
                    videoAssignmentChannelLogger = new channel_logger_1.ChannelLogger('video-assignment', this.requiredConfiguration.logsCallback);
                }
                this.videoAssignmentChannelHandler = new video_assignment_channel_handler_1.VideoAssignmentChannelHandler(this.videoAssignmentChannel, this.idMediaEntryMap, this.internalMediaEntryMap, this.idMediaLayoutMap, this.internalMediaLayoutMap, this.mediaEntriesDelegate, this.internalMeetStreamTrackMap, videoAssignmentChannelLogger);
            }
            if (this.requiredConfiguration.numberOfVideoStreams > 0 ||
                this.requiredConfiguration.enableAudioStreams) {
                this.mediaEntriesChannel = this.peerConnection.createDataChannel('media-entries', dataChannelConfig);
                let mediaEntriesChannelLogger;
                if ((_d = this.requiredConfiguration) === null || _d === void 0 ? void 0 : _d.logsCallback) {
                    mediaEntriesChannelLogger = new channel_logger_1.ChannelLogger('media-entries', this.requiredConfiguration.logsCallback);
                }
                this.mediaEntriesChannelHandler = new media_entries_channel_handler_1.MediaEntriesChannelHandler(this.mediaEntriesChannel, this.mediaEntriesDelegate, this.idMediaEntryMap, this.internalMediaEntryMap, this.internalMeetStreamTrackMap, this.internalMediaLayoutMap, this.participantsDelegate, this.nameParticipantMap, this.idParticipantMap, this.internalParticipantMap, this.presenterDelegate, this.screenshareDelegate, mediaEntriesChannelLogger);
                this.participantsChannel =
                    this.peerConnection.createDataChannel('participants');
                let participantsChannelLogger;
                if ((_e = this.requiredConfiguration) === null || _e === void 0 ? void 0 : _e.logsCallback) {
                    participantsChannelLogger = new channel_logger_1.ChannelLogger('participants', this.requiredConfiguration.logsCallback);
                }
                this.participantsChannelHandler = new participants_channel_handler_1.ParticipantsChannelHandler(this.participantsChannel, this.participantsDelegate, this.idParticipantMap, this.nameParticipantMap, this.internalParticipantMap, this.internalMediaEntryMap, participantsChannelLogger);
            }
            this.sessionStatusDelegate.subscribe((status) => {
                var _a, _b, _c;
                if (status.connectionState === enums_1.MeetConnectionState.DISCONNECTED) {
                    (_a = this.mediaStatsChannel) === null || _a === void 0 ? void 0 : _a.close();
                    (_b = this.videoAssignmentChannel) === null || _b === void 0 ? void 0 : _b.close();
                    (_c = this.mediaEntriesChannel) === null || _c === void 0 ? void 0 : _c.close();
                }
            });
            // Local description has to be set before adding video transceivers to
            // preserve the order of audio, datachannels, video.
            let pcOffer = yield this.peerConnection.createOffer();
            yield this.peerConnection.setLocalDescription(pcOffer);
            for (let i = 0; i < this.requiredConfiguration.numberOfVideoStreams; i++) {
                // Integrating clients must support and negotiate AV1, VP9, and VP8 codecs
                // in the SDP offer.
                // The default for WebRTC is VP8.
                // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/WebRTC_codecs.
                this.peerConnection.addTransceiver('video', { direction: 'recvonly' });
            }
            pcOffer = yield this.peerConnection.createOffer();
            yield this.peerConnection.setLocalDescription(pcOffer);
            const protocol = communicationProtocol !== null && communicationProtocol !== void 0 ? communicationProtocol : new default_communication_protocol_impl_1.DefaultCommunicationProtocolImpl(this.requiredConfiguration);
            const response = yield protocol.connectActiveConference((_f = pcOffer.sdp) !== null && _f !== void 0 ? _f : '');
            if (response === null || response === void 0 ? void 0 : response.answer) {
                yield this.peerConnection.setRemoteDescription({
                    type: 'answer',
                    sdp: response === null || response === void 0 ? void 0 : response.answer,
                });
            }
            else {
                // We do not expect this to happen and therefore it is an internal
                // error.
                throw new Error('Internal error, no answer in response');
            }
            return;
        });
    }
    leaveMeeting() {
        var _a;
        if (this.sessionControlChannelHandler) {
            return (_a = this.sessionControlChannelHandler) === null || _a === void 0 ? void 0 : _a.leaveSession();
        }
        else {
            throw new Error('You must connect to a meeting before leaving it');
        }
    }
    // The promise resolving on the request does not mean the layout has been
    // applied. It means that the request has been accepted and you may need to
    // wait a short amount of time for these layouts to be applied.
    applyLayout(requests) {
        if (!this.videoAssignmentChannelHandler) {
            throw new Error('You must connect to a meeting with video before applying a layout');
        }
        requests.forEach((request) => {
            if (!request.mediaLayout) {
                throw new Error('The request must include a media layout');
            }
            if (!this.internalMediaLayoutMap.has(request.mediaLayout)) {
                throw new Error('The media layout must be created using the client before it can be applied');
            }
        });
        return this.videoAssignmentChannelHandler.sendRequests(requests);
    }
    createMediaLayout(canvasDimensions) {
        const mediaEntryDelegate = new subscribable_impl_1.SubscribableDelegate(undefined);
        const mediaEntry = new subscribable_impl_1.SubscribableImpl(mediaEntryDelegate);
        const mediaLayout = { canvasDimensions, mediaEntry };
        this.internalMediaLayoutMap.set(mediaLayout, {
            id: this.mediaLayoutId,
            mediaEntry: mediaEntryDelegate,
        });
        this.idMediaLayoutMap.set(this.mediaLayoutId, mediaLayout);
        this.mediaLayoutId++;
        return mediaLayout;
    }
}
exports.MeetMediaApiClientImpl = MeetMediaApiClientImpl;


/***/ },

/***/ "../internal/subscribable_impl.ts"
/*!****************************************!*\
  !*** ../internal/subscribable_impl.ts ***!
  \****************************************/
(__unused_webpack_module, exports) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SubscribableDelegate = exports.SubscribableImpl = void 0;
/**
 * Implementation of the Subscribable interface.
 */
class SubscribableImpl {
    constructor(subscribableDelegate) {
        this.subscribableDelegate = subscribableDelegate;
    }
    get() {
        return this.subscribableDelegate.get();
    }
    subscribe(callback) {
        this.subscribableDelegate.subscribe(callback);
        return () => {
            this.subscribableDelegate.unsubscribe(callback);
        };
    }
    unsubscribe(callback) {
        return this.subscribableDelegate.unsubscribe(callback);
    }
}
exports.SubscribableImpl = SubscribableImpl;
/**
 * Helper class to update a subscribable value.
 */
class SubscribableDelegate {
    constructor(value) {
        this.value = value;
        this.subscribers = new Set();
        this.subscribable = new SubscribableImpl(this);
    }
    set(newValue) {
        if (this.value !== newValue) {
            this.value = newValue;
            for (const callback of this.subscribers) {
                callback(newValue);
            }
        }
    }
    get() {
        return this.value;
    }
    subscribe(callback) {
        this.subscribers.add(callback);
    }
    unsubscribe(callback) {
        return this.subscribers.delete(callback);
    }
    getSubscribable() {
        return this.subscribable;
    }
}
exports.SubscribableDelegate = SubscribableDelegate;


/***/ },

/***/ "../internal/utils.ts"
/*!****************************!*\
  !*** ../internal/utils.ts ***!
  \****************************/
(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createMediaEntry = createMediaEntry;
const subscribable_impl_1 = __webpack_require__(/*! ./subscribable_impl */ "../internal/subscribable_impl.ts");
/**
 * Creates a new media entry.
 * @return The new media entry and its internal representation.
 */
function createMediaEntry({ audioMuted = false, videoMuted = false, screenShare = false, isPresenter = false, participant, mediaLayout, videoMeetStreamTrack, audioMeetStreamTrack, audioCsrc, videoCsrc, videoSsrc, id, session = '', sessionName = '', }) {
    const participantDelegate = new subscribable_impl_1.SubscribableDelegate(participant);
    const audioMutedDelegate = new subscribable_impl_1.SubscribableDelegate(audioMuted);
    const videoMutedDelegate = new subscribable_impl_1.SubscribableDelegate(videoMuted);
    const screenShareDelegate = new subscribable_impl_1.SubscribableDelegate(screenShare);
    const isPresenterDelegate = new subscribable_impl_1.SubscribableDelegate(isPresenter);
    const mediaLayoutDelegate = new subscribable_impl_1.SubscribableDelegate(mediaLayout);
    const audioMeetStreamTrackDelegate = new subscribable_impl_1.SubscribableDelegate(audioMeetStreamTrack);
    const videoMeetStreamTrackDelegate = new subscribable_impl_1.SubscribableDelegate(videoMeetStreamTrack);
    const mediaEntry = {
        participant: participantDelegate.getSubscribable(),
        audioMuted: audioMutedDelegate.getSubscribable(),
        videoMuted: videoMutedDelegate.getSubscribable(),
        screenShare: screenShareDelegate.getSubscribable(),
        isPresenter: isPresenterDelegate.getSubscribable(),
        mediaLayout: mediaLayoutDelegate.getSubscribable(),
        audioMeetStreamTrack: audioMeetStreamTrackDelegate.getSubscribable(),
        videoMeetStreamTrack: videoMeetStreamTrackDelegate.getSubscribable(),
        sessionName,
        session,
    };
    const internalMediaEntry = {
        id,
        audioMuted: audioMutedDelegate,
        videoMuted: videoMutedDelegate,
        screenShare: screenShareDelegate,
        isPresenter: isPresenterDelegate,
        mediaLayout: mediaLayoutDelegate,
        audioMeetStreamTrack: audioMeetStreamTrackDelegate,
        videoMeetStreamTrack: videoMeetStreamTrackDelegate,
        participant: participantDelegate,
        videoSsrc,
        audioCsrc,
        videoCsrc,
    };
    return { mediaEntry, internalMediaEntry };
}


/***/ },

/***/ "../types/enums.ts"
/*!*************************!*\
  !*** ../types/enums.ts ***!
  \*************************/
(__unused_webpack_module, exports) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MeetDisconnectReason = exports.MeetConnectionState = exports.LogLevel = void 0;
/**
 * @fileoverview Enums for the Media API Web Client. Since other files are
 * using the .d.ts file, we need to keep the enums in this file.
 */
/**
 * Log level for each data channel.
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["UNKNOWN"] = 0] = "UNKNOWN";
    LogLevel[LogLevel["ERRORS"] = 1] = "ERRORS";
    LogLevel[LogLevel["RESOURCES"] = 2] = "RESOURCES";
    LogLevel[LogLevel["MESSAGES"] = 3] = "MESSAGES";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/** Connection state of the Meet Media API session. */
var MeetConnectionState;
(function (MeetConnectionState) {
    MeetConnectionState[MeetConnectionState["UNKNOWN"] = 0] = "UNKNOWN";
    MeetConnectionState[MeetConnectionState["WAITING"] = 1] = "WAITING";
    MeetConnectionState[MeetConnectionState["JOINED"] = 2] = "JOINED";
    MeetConnectionState[MeetConnectionState["DISCONNECTED"] = 3] = "DISCONNECTED";
})(MeetConnectionState || (exports.MeetConnectionState = MeetConnectionState = {}));
/** Reasons for the Meet Media API session to disconnect. */
var MeetDisconnectReason;
(function (MeetDisconnectReason) {
    MeetDisconnectReason[MeetDisconnectReason["UNKNOWN"] = 0] = "UNKNOWN";
    MeetDisconnectReason[MeetDisconnectReason["CLIENT_LEFT"] = 1] = "CLIENT_LEFT";
    MeetDisconnectReason[MeetDisconnectReason["USER_STOPPED"] = 2] = "USER_STOPPED";
    MeetDisconnectReason[MeetDisconnectReason["CONFERENCE_ENDED"] = 3] = "CONFERENCE_ENDED";
    MeetDisconnectReason[MeetDisconnectReason["SESSION_UNHEALTHY"] = 4] = "SESSION_UNHEALTHY";
})(MeetDisconnectReason || (exports.MeetDisconnectReason = MeetDisconnectReason = {}));


/***/ },

/***/ "./script.ts"
/*!*******************!*\
  !*** ./script.ts ***!
  \*******************/
(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createClient = createClient;
exports.joinMeeting = joinMeeting;
exports.leaveMeeting = leaveMeeting;
const meetmediaapiclient_impl_1 = __webpack_require__(/*! ../internal/meetmediaapiclient_impl */ "../internal/meetmediaapiclient_impl.ts");
const enums_1 = __webpack_require__(/*! ../types/enums */ "../types/enums.ts");
// Function maps session status to strings. If the session is joined, we go
// ahead and request a layout.
function handleSessionChange(status) {
    return __awaiter(this, void 0, void 0, function* () {
        let statusString;
        switch (status.connectionState) {
            case enums_1.MeetConnectionState.WAITING:
                statusString = 'WAITING';
                break;
            case enums_1.MeetConnectionState.JOINED:
                statusString = 'JOINED';
                // tslint:disable-next-line:no-any
                const client = window.client;
                const mediaLayout = client.createMediaLayout({ width: 500, height: 500 });
                const response = yield client.applyLayout([{ mediaLayout }]);
                console.log(response);
                break;
            case enums_1.MeetConnectionState.DISCONNECTED:
                statusString = 'DISCONNECTED';
                break;
            default:
                statusString = 'UNKNOWN';
                break;
        }
        // Update page with session status.
        document.getElementById('session-status').textContent =
            `Session Status: ${statusString}`;
    });
}
const VIDEO_IDS = [1, 2, 3, 4, 5, 6];
const AUDIO_IDS = [1, 2, 3];
let availableVideoIds = [...VIDEO_IDS];
let availableAudioIds = [...AUDIO_IDS];
const trackIdToElementId = new Map();
// Called when the Meet stream collection changes (when a Media track is added
// to or removed from the peer connection).
function handleStreamChange(meetStreamTracks) {
    // We create local sets of ids so that we don't have to add back ids when
    // tracks are removed.
    const localAvailableVideoIds = new Set(VIDEO_IDS);
    const localAvailableAudioIds = new Set(AUDIO_IDS);
    meetStreamTracks.forEach((meetStreamTrack) => {
        var _a, _b;
        if (meetStreamTrack.mediaStreamTrack.kind === 'video') {
            const elementId = trackIdToElementId.get(meetStreamTrack.mediaStreamTrack.id);
            if (elementId) {
                // If a track is already in the element then we remove it from the local
                // ids and continue.
                localAvailableVideoIds.delete(elementId);
                return;
            }
            // If this is a new track, then we create a MediaStream and add it to a
            // video element.
            const mediaStream = new MediaStream();
            mediaStream.addTrack(meetStreamTrack.mediaStreamTrack);
            // Update id collections. We do expect to run out of available ids, but
            // reassign to a valid id (1) in case we do.
            const videoId = (_a = availableVideoIds.pop()) !== null && _a !== void 0 ? _a : 1;
            localAvailableVideoIds.delete(videoId);
            // Retrieve available video element and assign media stream to it.
            const videoIdString = `video-${videoId}`;
            const videoElement = document.getElementById(videoIdString);
            videoElement.srcObject = mediaStream;
            trackIdToElementId.set(meetStreamTrack.mediaStreamTrack.id, videoId);
        }
        else if (meetStreamTrack.mediaStreamTrack.kind === 'audio') {
            const elementId = trackIdToElementId.get(meetStreamTrack.mediaStreamTrack.id);
            if (elementId) {
                // If a track is already in the element then we remove it from the local
                // ids and continue.
                localAvailableAudioIds.delete(elementId);
                return;
            }
            // If this is a new track, then we create a MediaStream and add it to a
            // audio element.
            const mediaStream = new MediaStream();
            mediaStream.addTrack(meetStreamTrack.mediaStreamTrack);
            // Update id collections. We do expect to run out of available ids, but
            // reassign to a valid id (1) in case we do.
            const audioId = (_b = availableAudioIds.pop()) !== null && _b !== void 0 ? _b : 1;
            localAvailableAudioIds.delete(audioId);
            // Retrieve available audio element and assign media stream to it.
            const audioIdString = `audio-${audioId}`;
            const audioElement = document.getElementById(audioIdString);
            audioElement.srcObject = mediaStream;
            trackIdToElementId.set(meetStreamTrack.mediaStreamTrack.id, audioId);
        }
    });
    // Set local set of tracks to top level available id collections.
    availableVideoIds = [...localAvailableVideoIds];
    availableAudioIds = [...localAvailableAudioIds];
}
/**
 * Create Media API client and subscribe to session status and meet stream
 * changes.
 */
function createClient(meetingSpaceId, numberOfVideoStreams, enableAudioStreams, accessToken) {
    const client = new meetmediaapiclient_impl_1.MeetMediaApiClientImpl({
        meetingSpaceId,
        numberOfVideoStreams,
        enableAudioStreams,
        accessToken,
    });
    // tslint:disable-next-line:no-any
    window.client = client;
    client.sessionStatus.subscribe(handleSessionChange);
    client.meetStreamTracks.subscribe(handleStreamChange);
    console.log('Media API Client created.');
}
/**
 * Join meeting if client exists
 */
function joinMeeting() {
    return __awaiter(this, void 0, void 0, function* () {
        // tslint:disable-next-line:no-any
        const client = window.client;
        if (!client)
            return;
        console.log(yield client.joinMeeting());
    });
}
/**
 * Leave meeting if client exists
 */
function leaveMeeting() {
    // tslint:disable-next-line:no-any
    console.log(window.client.leaveMeeting());
}


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./script.ts");
/******/ 	var __webpack_export_target__ = window;
/******/ 	for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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cGxlLy4uL2ludGVybmFsL2NoYW5uZWxfaGFuZGxlcnMvY2hhbm5lbF9sb2dnZXIudHMiLCJ3ZWJwYWNrOi8vbWVkaWFhcGlzYW1wbGUvLi4vaW50ZXJuYWwvY2hhbm5lbF9oYW5kbGVycy9tZWRpYV9lbnRyaWVzX2NoYW5uZWxfaGFuZGxlci50cyIsIndlYnBhY2s6Ly9tZWRpYWFwaXNhbXBsZS8uLi9pbnRlcm5hbC9jaGFubmVsX2hhbmRsZXJzL21lZGlhX3N0YXRzX2NoYW5uZWxfaGFuZGxlci50cyIsIndlYnBhY2s6Ly9tZWRpYWFwaXNhbXBsZS8uLi9pbnRlcm5hbC9jaGFubmVsX2hhbmRsZXJzL3BhcnRpY2lwYW50c19jaGFubmVsX2hhbmRsZXIudHMiLCJ3ZWJwYWNrOi8vbWVkaWFhcGlzYW1wbGUvLi4vaW50ZXJuYWwvY2hhbm5lbF9oYW5kbGVycy9zZXNzaW9uX2NvbnRyb2xfY2hhbm5lbF9oYW5kbGVyLnRzIiwid2VicGFjazovL21lZGlhYXBpc2FtcGxlLy4uL2ludGVybmFsL2NoYW5uZWxfaGFuZGxlcnMvdmlkZW9fYXNzaWdubWVudF9jaGFubmVsX2hhbmRsZXIudHMiLCJ3ZWJwYWNrOi8vbWVkaWFhcGlzYW1wbGUvLi4vaW50ZXJuYWwvY29tbXVuaWNhdGlvbl9wcm90b2NvbHMvZGVmYXVsdF9jb21tdW5pY2F0aW9uX3Byb3RvY29sX2ltcGwudHMiLCJ3ZWJwYWNrOi8vbWVkaWFhcGlzYW1wbGUvLi4vaW50ZXJuYWwvaW50ZXJuYWxfbWVldF9zdHJlYW1fdHJhY2tfaW1wbC50cyIsIndlYnBhY2s6Ly9tZWRpYWFwaXNhbXBsZS8uLi9pbnRlcm5hbC9tZWV0X3N0cmVhbV90cmFja19pbXBsLnRzIiwid2VicGFjazovL21lZGlhYXBpc2FtcGxlLy4uL2ludGVybmFsL21lZXRtZWRpYWFwaWNsaWVudF9pbXBsLnRzIiwid2VicGFjazovL21lZGlhYXBpc2FtcGxlLy4uL2ludGVybmFsL3N1YnNjcmliYWJsZV9pbXBsLnRzIiwid2VicGFjazovL21lZGlhYXBpc2FtcGxlLy4uL2ludGVybmFsL3V0aWxzLnRzIiwid2VicGFjazovL21lZGlhYXBpc2FtcGxlLy4uL3R5cGVzL2VudW1zLnRzIiwid2VicGFjazovL21lZGlhYXBpc2FtcGxlLy4vc2NyaXB0LnRzIiwid2VicGFjazovL21lZGlhYXBpc2FtcGxlL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL21lZGlhYXBpc2FtcGxlL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vbWVkaWFhcGlzYW1wbGUvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL21lZGlhYXBpc2FtcGxlL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMjQgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQSBoZWxwZXIgY2xhc3MgdGhhdCBhbGxvd3MgdXNlciB0byBsb2dzIGV2ZW50cyB0byBhIHNwZWNpZmllZFxuICogZnVuY3Rpb24uXG4gKi9cblxuaW1wb3J0IHtcbiAgRGVsZXRlZFJlc291cmNlLFxuICBNZWRpYUFwaVJlcXVlc3QsXG4gIE1lZGlhQXBpUmVzcG9uc2UsXG4gIFJlc291cmNlU25hcHNob3QsXG59IGZyb20gJy4uLy4uL3R5cGVzL2RhdGFjaGFubmVscyc7XG5pbXBvcnQge0xvZ0xldmVsfSBmcm9tICcuLi8uLi90eXBlcy9lbnVtcyc7XG5pbXBvcnQge0xvZ0V2ZW50LCBMb2dTb3VyY2VUeXBlfSBmcm9tICcuLi8uLi90eXBlcy9tZWRpYXR5cGVzJztcblxuLyoqXG4gKiBIZWxwZXIgY2xhc3MgdGhhdCBoZWxwcyBsb2cgY2hhbm5lbCByZXNvdXJjZXMsIHVwZGF0ZXMgb3IgZXJyb3JzLlxuICovXG5leHBvcnQgY2xhc3MgQ2hhbm5lbExvZ2dlciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgbG9nU291cmNlVHlwZTogTG9nU291cmNlVHlwZSxcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcHJpdmF0ZSByZWFkb25seSBjYWxsYmFjayA9IChsb2dFdmVudDogTG9nRXZlbnQpID0+IHt9LFxuICApIHt9XG5cbiAgbG9nKFxuICAgIGxldmVsOiBMb2dMZXZlbCxcbiAgICBsb2dTdHJpbmc6IHN0cmluZyxcbiAgICByZWxldmFudE9iamVjdD86XG4gICAgICB8IEVycm9yXG4gICAgICB8IERlbGV0ZWRSZXNvdXJjZVxuICAgICAgfCBSZXNvdXJjZVNuYXBzaG90XG4gICAgICB8IE1lZGlhQXBpUmVzcG9uc2VcbiAgICAgIHwgTWVkaWFBcGlSZXF1ZXN0LFxuICApIHtcbiAgICB0aGlzLmNhbGxiYWNrKHtcbiAgICAgIHNvdXJjZVR5cGU6IHRoaXMubG9nU291cmNlVHlwZSxcbiAgICAgIGxldmVsLFxuICAgICAgbG9nU3RyaW5nLFxuICAgICAgcmVsZXZhbnRPYmplY3QsXG4gICAgfSk7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAyNCBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogQGZpbGVvdmVydmlldyBIYW5kbGVzIE1lZGlhIGVudHJpZXNcbiAqL1xuXG5pbXBvcnQge1xuICBEZWxldGVkTWVkaWFFbnRyeSxcbiAgTWVkaWFFbnRyaWVzQ2hhbm5lbFRvQ2xpZW50LFxuICBNZWRpYUVudHJ5UmVzb3VyY2UsXG59IGZyb20gJy4uLy4uL3R5cGVzL2RhdGFjaGFubmVscyc7XG5pbXBvcnQge0xvZ0xldmVsfSBmcm9tICcuLi8uLi90eXBlcy9lbnVtcyc7XG5pbXBvcnQge1xuICBNZWRpYUVudHJ5LFxuICBNZWRpYUxheW91dCxcbiAgTWVldFN0cmVhbVRyYWNrLFxuICBQYXJ0aWNpcGFudCxcbn0gZnJvbSAnLi4vLi4vdHlwZXMvbWVkaWF0eXBlcyc7XG5pbXBvcnQge1xuICBJbnRlcm5hbE1lZGlhRW50cnksXG4gIEludGVybmFsTWVkaWFMYXlvdXQsXG4gIEludGVybmFsTWVldFN0cmVhbVRyYWNrLFxuICBJbnRlcm5hbFBhcnRpY2lwYW50LFxufSBmcm9tICcuLi9pbnRlcm5hbF90eXBlcyc7XG5pbXBvcnQge1N1YnNjcmliYWJsZURlbGVnYXRlfSBmcm9tICcuLi9zdWJzY3JpYmFibGVfaW1wbCc7XG5pbXBvcnQge2NyZWF0ZU1lZGlhRW50cnl9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7Q2hhbm5lbExvZ2dlcn0gZnJvbSAnLi9jaGFubmVsX2xvZ2dlcic7XG5cbi8qKlxuICogSGVscGVyIGNsYXNzIHRvIGhhbmRsZSB0aGUgbWVkaWEgZW50cmllcyBjaGFubmVsLlxuICovXG5leHBvcnQgY2xhc3MgTWVkaWFFbnRyaWVzQ2hhbm5lbEhhbmRsZXIge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNoYW5uZWw6IFJUQ0RhdGFDaGFubmVsLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgbWVkaWFFbnRyaWVzRGVsZWdhdGU6IFN1YnNjcmliYWJsZURlbGVnYXRlPE1lZGlhRW50cnlbXT4sXG4gICAgcHJpdmF0ZSByZWFkb25seSBpZE1lZGlhRW50cnlNYXA6IE1hcDxudW1iZXIsIE1lZGlhRW50cnk+LFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaW50ZXJuYWxNZWRpYUVudHJ5TWFwID0gbmV3IE1hcDxcbiAgICAgIE1lZGlhRW50cnksXG4gICAgICBJbnRlcm5hbE1lZGlhRW50cnlcbiAgICA+KCksXG4gICAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbE1lZXRTdHJlYW1UcmFja01hcCA9IG5ldyBNYXA8XG4gICAgICBNZWV0U3RyZWFtVHJhY2ssXG4gICAgICBJbnRlcm5hbE1lZXRTdHJlYW1UcmFja1xuICAgID4oKSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGludGVybmFsTWVkaWFMYXlvdXRNYXAgPSBuZXcgTWFwPFxuICAgICAgTWVkaWFMYXlvdXQsXG4gICAgICBJbnRlcm5hbE1lZGlhTGF5b3V0XG4gICAgPigpLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcGFydGljaXBhbnRzRGVsZWdhdGU6IFN1YnNjcmliYWJsZURlbGVnYXRlPFBhcnRpY2lwYW50W10+LFxuICAgIHByaXZhdGUgcmVhZG9ubHkgbmFtZVBhcnRpY2lwYW50TWFwOiBNYXA8c3RyaW5nLCBQYXJ0aWNpcGFudD4sXG4gICAgcHJpdmF0ZSByZWFkb25seSBpZFBhcnRpY2lwYW50TWFwOiBNYXA8bnVtYmVyLCBQYXJ0aWNpcGFudD4sXG4gICAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbFBhcnRpY2lwYW50TWFwOiBNYXA8XG4gICAgICBQYXJ0aWNpcGFudCxcbiAgICAgIEludGVybmFsUGFydGljaXBhbnRcbiAgICA+LFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcHJlc2VudGVyRGVsZWdhdGU6IFN1YnNjcmliYWJsZURlbGVnYXRlPFxuICAgICAgTWVkaWFFbnRyeSB8IHVuZGVmaW5lZFxuICAgID4sXG4gICAgcHJpdmF0ZSByZWFkb25seSBzY3JlZW5zaGFyZURlbGVnYXRlOiBTdWJzY3JpYmFibGVEZWxlZ2F0ZTxcbiAgICAgIE1lZGlhRW50cnkgfCB1bmRlZmluZWRcbiAgICA+LFxuICAgIHByaXZhdGUgcmVhZG9ubHkgY2hhbm5lbExvZ2dlcj86IENoYW5uZWxMb2dnZXIsXG4gICkge1xuICAgIHRoaXMuY2hhbm5lbC5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMub25NZWRpYUVudHJpZXNNZXNzYWdlKGV2ZW50KTtcbiAgICB9O1xuICAgIHRoaXMuY2hhbm5lbC5vbm9wZW4gPSAoKSA9PiB7XG4gICAgICB0aGlzLmNoYW5uZWxMb2dnZXI/LmxvZyhcbiAgICAgICAgTG9nTGV2ZWwuTUVTU0FHRVMsXG4gICAgICAgICdNZWRpYSBlbnRyaWVzIGNoYW5uZWw6IG9wZW5lZCcsXG4gICAgICApO1xuICAgIH07XG4gICAgdGhpcy5jaGFubmVsLm9uY2xvc2UgPSAoKSA9PiB7XG4gICAgICB0aGlzLmNoYW5uZWxMb2dnZXI/LmxvZyhcbiAgICAgICAgTG9nTGV2ZWwuTUVTU0FHRVMsXG4gICAgICAgICdNZWRpYSBlbnRyaWVzIGNoYW5uZWw6IGNsb3NlZCcsXG4gICAgICApO1xuICAgIH07XG4gIH1cblxuICBwcml2YXRlIG9uTWVkaWFFbnRyaWVzTWVzc2FnZShtZXNzYWdlOiBNZXNzYWdlRXZlbnQpIHtcbiAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShtZXNzYWdlLmRhdGEpIGFzIE1lZGlhRW50cmllc0NoYW5uZWxUb0NsaWVudDtcbiAgICBsZXQgbWVkaWFFbnRyeUFycmF5ID0gdGhpcy5tZWRpYUVudHJpZXNEZWxlZ2F0ZS5nZXQoKTtcblxuICAgIC8vIERlbGV0ZSBtZWRpYSBlbnRyaWVzLlxuICAgIGRhdGEuZGVsZXRlZFJlc291cmNlcz8uZm9yRWFjaCgoZGVsZXRlZFJlc291cmNlOiBEZWxldGVkTWVkaWFFbnRyeSkgPT4ge1xuICAgICAgdGhpcy5jaGFubmVsTG9nZ2VyPy5sb2coXG4gICAgICAgIExvZ0xldmVsLlJFU09VUkNFUyxcbiAgICAgICAgJ01lZGlhIGVudHJpZXMgY2hhbm5lbDogcmVzb3VyY2UgZGVsZXRlZCcsXG4gICAgICAgIGRlbGV0ZWRSZXNvdXJjZSxcbiAgICAgICk7XG4gICAgICBjb25zdCBkZWxldGVkTWVkaWFFbnRyeSA9IHRoaXMuaWRNZWRpYUVudHJ5TWFwLmdldChkZWxldGVkUmVzb3VyY2UuaWQpO1xuICAgICAgaWYgKGRlbGV0ZWRNZWRpYUVudHJ5KSB7XG4gICAgICAgIG1lZGlhRW50cnlBcnJheSA9IG1lZGlhRW50cnlBcnJheS5maWx0ZXIoXG4gICAgICAgICAgKG1lZGlhRW50cnkpID0+IG1lZGlhRW50cnkgIT09IGRlbGV0ZWRNZWRpYUVudHJ5LFxuICAgICAgICApO1xuICAgICAgICAvLyBJZiB3ZSBmaW5kIHRoZSBtZWRpYSBlbnRyeSBpbiB0aGUgaWQgbWFwLCBpdCBzaG91bGQgZXhpc3QgaW4gdGhlXG4gICAgICAgIC8vIGludGVybmFsIG1hcC5cbiAgICAgICAgY29uc3QgaW50ZXJuYWxNZWRpYUVudHJ5ID1cbiAgICAgICAgICB0aGlzLmludGVybmFsTWVkaWFFbnRyeU1hcC5nZXQoZGVsZXRlZE1lZGlhRW50cnkpO1xuICAgICAgICAvLyBSZW1vdmUgcmVsYXRpb25zaGlwIGJldHdlZW4gbWVkaWEgZW50cnkgYW5kIG1lZGlhIGxheW91dC5cbiAgICAgICAgY29uc3QgbWVkaWFMYXlvdXQ6IE1lZGlhTGF5b3V0IHwgdW5kZWZpbmVkID1cbiAgICAgICAgICBpbnRlcm5hbE1lZGlhRW50cnkhLm1lZGlhTGF5b3V0LmdldCgpO1xuICAgICAgICBpZiAobWVkaWFMYXlvdXQpIHtcbiAgICAgICAgICBjb25zdCBpbnRlcm5hbE1lZGlhTGF5b3V0ID1cbiAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxNZWRpYUxheW91dE1hcC5nZXQobWVkaWFMYXlvdXQpO1xuICAgICAgICAgIGlmIChpbnRlcm5hbE1lZGlhTGF5b3V0KSB7XG4gICAgICAgICAgICBpbnRlcm5hbE1lZGlhTGF5b3V0Lm1lZGlhRW50cnkuc2V0KHVuZGVmaW5lZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIG1lZGlhIGVudHJ5IGFuZCBtZWV0IHN0cmVhbSB0cmFja3MuXG4gICAgICAgIGNvbnN0IHZpZGVvTWVldFN0cmVhbVRyYWNrID1cbiAgICAgICAgICBpbnRlcm5hbE1lZGlhRW50cnkhLnZpZGVvTWVldFN0cmVhbVRyYWNrLmdldCgpO1xuICAgICAgICBpZiAodmlkZW9NZWV0U3RyZWFtVHJhY2spIHtcbiAgICAgICAgICBjb25zdCBpbnRlcm5hbFZpZGVvU3RyZWFtVHJhY2sgPVxuICAgICAgICAgICAgdGhpcy5pbnRlcm5hbE1lZXRTdHJlYW1UcmFja01hcC5nZXQodmlkZW9NZWV0U3RyZWFtVHJhY2spO1xuICAgICAgICAgIGludGVybmFsVmlkZW9TdHJlYW1UcmFjayEubWVkaWFFbnRyeS5zZXQodW5kZWZpbmVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGF1ZGlvTWVldFN0cmVhbVRyYWNrID1cbiAgICAgICAgICBpbnRlcm5hbE1lZGlhRW50cnkhLmF1ZGlvTWVldFN0cmVhbVRyYWNrLmdldCgpO1xuICAgICAgICBpZiAoYXVkaW9NZWV0U3RyZWFtVHJhY2spIHtcbiAgICAgICAgICBjb25zdCBpbnRlcm5hbEF1ZGlvU3RyZWFtVHJhY2sgPVxuICAgICAgICAgICAgdGhpcy5pbnRlcm5hbE1lZXRTdHJlYW1UcmFja01hcC5nZXQoYXVkaW9NZWV0U3RyZWFtVHJhY2spO1xuICAgICAgICAgIGludGVybmFsQXVkaW9TdHJlYW1UcmFjayEubWVkaWFFbnRyeS5zZXQodW5kZWZpbmVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSByZWxhdGlvbnNoaXAgYmV0d2VlbiBtZWRpYSBlbnRyeSBhbmQgcGFydGljaXBhbnQuXG4gICAgICAgIGNvbnN0IHBhcnRpY2lwYW50ID0gaW50ZXJuYWxNZWRpYUVudHJ5IS5wYXJ0aWNpcGFudC5nZXQoKTtcbiAgICAgICAgaWYgKHBhcnRpY2lwYW50KSB7XG4gICAgICAgICAgY29uc3QgaW50ZXJuYWxQYXJ0aWNpcGFudCA9XG4gICAgICAgICAgICB0aGlzLmludGVybmFsUGFydGljaXBhbnRNYXAuZ2V0KHBhcnRpY2lwYW50KTtcbiAgICAgICAgICBjb25zdCBuZXdNZWRpYUVudHJpZXM6IE1lZGlhRW50cnlbXSA9XG4gICAgICAgICAgICBpbnRlcm5hbFBhcnRpY2lwYW50IS5tZWRpYUVudHJpZXNcbiAgICAgICAgICAgICAgLmdldCgpXG4gICAgICAgICAgICAgIC5maWx0ZXIoKG1lZGlhRW50cnkpID0+IG1lZGlhRW50cnkgIT09IGRlbGV0ZWRNZWRpYUVudHJ5KTtcbiAgICAgICAgICBpbnRlcm5hbFBhcnRpY2lwYW50IS5tZWRpYUVudHJpZXMuc2V0KG5ld01lZGlhRW50cmllcyk7XG4gICAgICAgICAgaW50ZXJuYWxNZWRpYUVudHJ5IS5wYXJ0aWNpcGFudC5zZXQodW5kZWZpbmVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSBmcm9tIG1hcHNcbiAgICAgICAgdGhpcy5pZE1lZGlhRW50cnlNYXAuZGVsZXRlKGRlbGV0ZWRSZXNvdXJjZS5pZCk7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxNZWRpYUVudHJ5TWFwLmRlbGV0ZShkZWxldGVkTWVkaWFFbnRyeSk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2NyZWVuc2hhcmVEZWxlZ2F0ZS5nZXQoKSA9PT0gZGVsZXRlZE1lZGlhRW50cnkpIHtcbiAgICAgICAgICB0aGlzLnNjcmVlbnNoYXJlRGVsZWdhdGUuc2V0KHVuZGVmaW5lZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJlc2VudGVyRGVsZWdhdGUuZ2V0KCkgPT09IGRlbGV0ZWRNZWRpYUVudHJ5KSB7XG4gICAgICAgICAgdGhpcy5wcmVzZW50ZXJEZWxlZ2F0ZS5zZXQodW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIG9yIGFkZCBtZWRpYSBlbnRyaWVzLlxuICAgIGNvbnN0IGFkZGVkTWVkaWFFbnRyaWVzOiBNZWRpYUVudHJ5W10gPSBbXTtcbiAgICBkYXRhLnJlc291cmNlcz8uZm9yRWFjaCgocmVzb3VyY2U6IE1lZGlhRW50cnlSZXNvdXJjZSkgPT4ge1xuICAgICAgdGhpcy5jaGFubmVsTG9nZ2VyPy5sb2coXG4gICAgICAgIExvZ0xldmVsLlJFU09VUkNFUyxcbiAgICAgICAgJ01lZGlhIGVudHJpZXMgY2hhbm5lbDogcmVzb3VyY2UgYWRkZWQnLFxuICAgICAgICByZXNvdXJjZSxcbiAgICAgICk7XG5cbiAgICAgIGxldCBpbnRlcm5hbE1lZGlhRW50cnk6IEludGVybmFsTWVkaWFFbnRyeSB8IHVuZGVmaW5lZDtcbiAgICAgIGxldCBtZWRpYUVudHJ5OiBNZWRpYUVudHJ5IHwgdW5kZWZpbmVkO1xuICAgICAgbGV0IHZpZGVvQ3NyYyA9IDA7XG4gICAgICBpZiAoXG4gICAgICAgIHJlc291cmNlLm1lZGlhRW50cnkudmlkZW9Dc3JjcyAmJlxuICAgICAgICByZXNvdXJjZS5tZWRpYUVudHJ5LnZpZGVvQ3NyY3MubGVuZ3RoID4gMFxuICAgICAgKSB7XG4gICAgICAgIC8vIFdlIGV4cGVjdCB0aGVyZSB0byBvbmx5IGJlIG9uZSB2aWRlbyBDc3Jjcy4gVGhlcmUgaXMgcG9zc2liaWxpdHlcbiAgICAgICAgLy8gZm9yIHRoaXMgdG8gYmUgbW9yZSB0aGFuIHZhbHVlIGluIFdlYlJUQyBidXQgdW5saWtlbHkgaW4gTWVldC5cbiAgICAgICAgLy8gVE9ETyA6IEV4cGxvcmUgbWFraW5nIHZpZGVvIGNzcmNzIGZpZWxkIHNpbmdsdWFyLlxuICAgICAgICB2aWRlb0NzcmMgPSByZXNvdXJjZS5tZWRpYUVudHJ5LnZpZGVvQ3NyY3NbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNoYW5uZWxMb2dnZXI/LmxvZyhcbiAgICAgICAgICBMb2dMZXZlbC5FUlJPUlMsXG4gICAgICAgICAgJ01lZGlhIGVudHJpZXMgY2hhbm5lbDogbW9yZSB0aGFuIG9uZSB2aWRlbyBDc3JjIGluIG1lZGlhIGVudHJ5JyxcbiAgICAgICAgICByZXNvdXJjZSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuaWRNZWRpYUVudHJ5TWFwLmhhcyhyZXNvdXJjZS5pZCEpKSB7XG4gICAgICAgIC8vIFVwZGF0ZSBtZWRpYSBlbnRyeSBpZiBpdCBhbHJlYWR5IGV4aXN0cy5cbiAgICAgICAgbWVkaWFFbnRyeSA9IHRoaXMuaWRNZWRpYUVudHJ5TWFwLmdldChyZXNvdXJjZS5pZCEpO1xuICAgICAgICBtZWRpYUVudHJ5IS5zZXNzaW9uTmFtZSA9IHJlc291cmNlLm1lZGlhRW50cnkuc2Vzc2lvbk5hbWU7XG4gICAgICAgIG1lZGlhRW50cnkhLnNlc3Npb24gPSByZXNvdXJjZS5tZWRpYUVudHJ5LnNlc3Npb247XG4gICAgICAgIGludGVybmFsTWVkaWFFbnRyeSA9IHRoaXMuaW50ZXJuYWxNZWRpYUVudHJ5TWFwLmdldChtZWRpYUVudHJ5ISk7XG4gICAgICAgIGludGVybmFsTWVkaWFFbnRyeSEuYXVkaW9NdXRlZC5zZXQocmVzb3VyY2UubWVkaWFFbnRyeS5hdWRpb011dGVkKTtcbiAgICAgICAgaW50ZXJuYWxNZWRpYUVudHJ5IS52aWRlb011dGVkLnNldChyZXNvdXJjZS5tZWRpYUVudHJ5LnZpZGVvTXV0ZWQpO1xuICAgICAgICBpbnRlcm5hbE1lZGlhRW50cnkhLnNjcmVlblNoYXJlLnNldChyZXNvdXJjZS5tZWRpYUVudHJ5LnNjcmVlbnNoYXJlKTtcbiAgICAgICAgaW50ZXJuYWxNZWRpYUVudHJ5IS5pc1ByZXNlbnRlci5zZXQocmVzb3VyY2UubWVkaWFFbnRyeS5wcmVzZW50ZXIpO1xuICAgICAgICBpbnRlcm5hbE1lZGlhRW50cnkhLmF1ZGlvQ3NyYyA9IHJlc291cmNlLm1lZGlhRW50cnkuYXVkaW9Dc3JjO1xuICAgICAgICBpbnRlcm5hbE1lZGlhRW50cnkhLnZpZGVvQ3NyYyA9IHZpZGVvQ3NyYztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENyZWF0ZSBuZXcgbWVkaWEgZW50cnkgaWYgaXQgZG9lcyBub3QgZXhpc3QuXG4gICAgICAgIGNvbnN0IG1lZGlhRW50cnlFbGVtZW50ID0gY3JlYXRlTWVkaWFFbnRyeSh7XG4gICAgICAgICAgYXVkaW9NdXRlZDogcmVzb3VyY2UubWVkaWFFbnRyeS5hdWRpb011dGVkLFxuICAgICAgICAgIHZpZGVvTXV0ZWQ6IHJlc291cmNlLm1lZGlhRW50cnkudmlkZW9NdXRlZCxcbiAgICAgICAgICBzY3JlZW5TaGFyZTogcmVzb3VyY2UubWVkaWFFbnRyeS5zY3JlZW5zaGFyZSxcbiAgICAgICAgICBpc1ByZXNlbnRlcjogcmVzb3VyY2UubWVkaWFFbnRyeS5wcmVzZW50ZXIsXG4gICAgICAgICAgaWQ6IHJlc291cmNlLmlkISxcbiAgICAgICAgICBhdWRpb0NzcmM6IHJlc291cmNlLm1lZGlhRW50cnkuYXVkaW9Dc3JjLFxuICAgICAgICAgIHZpZGVvQ3NyYyxcbiAgICAgICAgICBzZXNzaW9uTmFtZTogcmVzb3VyY2UubWVkaWFFbnRyeS5zZXNzaW9uTmFtZSxcbiAgICAgICAgICBzZXNzaW9uOiByZXNvdXJjZS5tZWRpYUVudHJ5LnNlc3Npb24sXG4gICAgICAgIH0pO1xuICAgICAgICBpbnRlcm5hbE1lZGlhRW50cnkgPSBtZWRpYUVudHJ5RWxlbWVudC5pbnRlcm5hbE1lZGlhRW50cnk7XG4gICAgICAgIG1lZGlhRW50cnkgPSBtZWRpYUVudHJ5RWxlbWVudC5tZWRpYUVudHJ5O1xuICAgICAgICB0aGlzLmludGVybmFsTWVkaWFFbnRyeU1hcC5zZXQobWVkaWFFbnRyeSwgaW50ZXJuYWxNZWRpYUVudHJ5KTtcbiAgICAgICAgdGhpcy5pZE1lZGlhRW50cnlNYXAuc2V0KGludGVybmFsTWVkaWFFbnRyeS5pZCwgbWVkaWFFbnRyeSk7XG4gICAgICAgIGFkZGVkTWVkaWFFbnRyaWVzLnB1c2gobWVkaWFFbnRyeSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEFzc2lnbiBtZWV0IHN0cmVhbXMgdG8gbWVkaWEgZW50cnkgaWYgdGhleSBhcmUgbm90IGFscmVhZHkgYXNzaWduZWRcbiAgICAgIC8vIGNvcnJlY3RseS5cbiAgICAgIGlmIChcbiAgICAgICAgIW1lZGlhRW50cnkhLmF1ZGlvTXV0ZWQuZ2V0KCkgJiZcbiAgICAgICAgaW50ZXJuYWxNZWRpYUVudHJ5IS5hdWRpb0NzcmMgJiZcbiAgICAgICAgIXRoaXMuaXNNZWRpYUVudHJ5QXNzaWduZWRUb01lZXRTdHJlYW1UcmFjayhpbnRlcm5hbE1lZGlhRW50cnkhKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuYXNzaWduQXVkaW9NZWV0U3RyZWFtVHJhY2sobWVkaWFFbnRyeSEsIGludGVybmFsTWVkaWFFbnRyeSEpO1xuICAgICAgfVxuXG4gICAgICAvLyBBc3NpZ24gcGFydGljaXBhbnQgdG8gbWVkaWEgZW50cnlcbiAgICAgIGxldCBleGlzdGluZ1BhcnRpY2lwYW50OiBQYXJ0aWNpcGFudCB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChyZXNvdXJjZS5tZWRpYUVudHJ5LnBhcnRpY2lwYW50KSB7XG4gICAgICAgIGV4aXN0aW5nUGFydGljaXBhbnQgPSB0aGlzLm5hbWVQYXJ0aWNpcGFudE1hcC5nZXQoXG4gICAgICAgICAgcmVzb3VyY2UubWVkaWFFbnRyeS5wYXJ0aWNpcGFudCxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAocmVzb3VyY2UubWVkaWFFbnRyeS5wYXJ0aWNpcGFudEtleSkge1xuICAgICAgICBleGlzdGluZ1BhcnRpY2lwYW50ID0gQXJyYXkuZnJvbShcbiAgICAgICAgICB0aGlzLmludGVybmFsUGFydGljaXBhbnRNYXAuZW50cmllcygpLFxuICAgICAgICApLmZpbmQoXG4gICAgICAgICAgKFtwYXJ0aWNpcGFudCwgX10pID0+XG4gICAgICAgICAgICBwYXJ0aWNpcGFudC5wYXJ0aWNpcGFudC5wYXJ0aWNpcGFudEtleSA9PT1cbiAgICAgICAgICAgIHJlc291cmNlLm1lZGlhRW50cnkucGFydGljaXBhbnRLZXksXG4gICAgICAgICk/LlswXTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV4aXN0aW5nUGFydGljaXBhbnQpIHtcbiAgICAgICAgY29uc3QgaW50ZXJuYWxQYXJ0aWNpcGFudCA9XG4gICAgICAgICAgdGhpcy5pbnRlcm5hbFBhcnRpY2lwYW50TWFwLmdldChleGlzdGluZ1BhcnRpY2lwYW50KTtcbiAgICAgICAgaWYgKGludGVybmFsUGFydGljaXBhbnQpIHtcbiAgICAgICAgICBjb25zdCBuZXdNZWRpYUVudHJpZXM6IE1lZGlhRW50cnlbXSA9IFtcbiAgICAgICAgICAgIC4uLmludGVybmFsUGFydGljaXBhbnQubWVkaWFFbnRyaWVzLmdldCgpLFxuICAgICAgICAgICAgbWVkaWFFbnRyeSEsXG4gICAgICAgICAgXTtcbiAgICAgICAgICBpbnRlcm5hbFBhcnRpY2lwYW50Lm1lZGlhRW50cmllcy5zZXQobmV3TWVkaWFFbnRyaWVzKTtcbiAgICAgICAgfVxuICAgICAgICBpbnRlcm5hbE1lZGlhRW50cnkhLnBhcnRpY2lwYW50LnNldChleGlzdGluZ1BhcnRpY2lwYW50KTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHJlc291cmNlLm1lZGlhRW50cnkucGFydGljaXBhbnQgfHxcbiAgICAgICAgcmVzb3VyY2UubWVkaWFFbnRyeS5wYXJ0aWNpcGFudEtleVxuICAgICAgKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgdW5leHBlY3RlZCBiZWhhdmlvciwgYnV0IHRlY2huaWNhbGx5IHBvc3NpYmxlLiBXZSBleHBlY3RcbiAgICAgICAgLy8gdGhhdCB0aGUgcGFydGljaXBhbnRzIGFyZSByZWNlaXZlZCBmcm9tIHRoZSBwYXJ0aWNpcGFudHMgY2hhbm5lbFxuICAgICAgICAvLyBiZWZvcmUgdGhlIG1lZGlhIGVudHJpZXMgY2hhbm5lbCBidXQgdGhpcyBpcyBub3QgZ3VhcmFudGVlZC5cbiAgICAgICAgdGhpcy5jaGFubmVsTG9nZ2VyPy5sb2coXG4gICAgICAgICAgTG9nTGV2ZWwuUkVTT1VSQ0VTLFxuICAgICAgICAgICdNZWRpYSBlbnRyaWVzIGNoYW5uZWw6IHBhcnRpY2lwYW50IG5vdCBmb3VuZCBpbiBuYW1lIHBhcnRpY2lwYW50IG1hcCcgK1xuICAgICAgICAgICAgJyBjcmVhdGluZyBwYXJ0aWNpcGFudCcsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IHN1YnNjcmliYWJsZURlbGVnYXRlID0gbmV3IFN1YnNjcmliYWJsZURlbGVnYXRlPE1lZGlhRW50cnlbXT4oW1xuICAgICAgICAgIG1lZGlhRW50cnkhLFxuICAgICAgICBdKTtcbiAgICAgICAgY29uc3QgbmV3UGFydGljaXBhbnQ6IFBhcnRpY2lwYW50ID0ge1xuICAgICAgICAgIHBhcnRpY2lwYW50OiB7XG4gICAgICAgICAgICBuYW1lOiByZXNvdXJjZS5tZWRpYUVudHJ5LnBhcnRpY2lwYW50LFxuICAgICAgICAgICAgYW5vbnltb3VzVXNlcjoge30sXG4gICAgICAgICAgICBwYXJ0aWNpcGFudEtleTogcmVzb3VyY2UubWVkaWFFbnRyeS5wYXJ0aWNpcGFudEtleSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG1lZGlhRW50cmllczogc3Vic2NyaWJhYmxlRGVsZWdhdGUuZ2V0U3Vic2NyaWJhYmxlKCksXG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE86IFVzZSBwYXJ0aWNpcGFudCByZXNvdXJjZSBuYW1lIGluc3RlYWQgb2YgaWQuXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpkZXByZWNhdGlvblxuICAgICAgICBjb25zdCBpZHM6IFNldDxudW1iZXI+ID0gcmVzb3VyY2UubWVkaWFFbnRyeS5wYXJ0aWNpcGFudElkXG4gICAgICAgICAgPyAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6ZGVwcmVjYXRpb25cbiAgICAgICAgICAgIG5ldyBTZXQoW3Jlc291cmNlLm1lZGlhRW50cnkucGFydGljaXBhbnRJZF0pXG4gICAgICAgICAgOiBuZXcgU2V0KCk7XG4gICAgICAgIGNvbnN0IGludGVybmFsUGFydGljaXBhbnQ6IEludGVybmFsUGFydGljaXBhbnQgPSB7XG4gICAgICAgICAgbmFtZTogcmVzb3VyY2UubWVkaWFFbnRyeS5wYXJ0aWNpcGFudCA/PyAnJyxcbiAgICAgICAgICBpZHMsXG4gICAgICAgICAgbWVkaWFFbnRyaWVzOiBzdWJzY3JpYmFibGVEZWxlZ2F0ZSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlc291cmNlLm1lZGlhRW50cnkucGFydGljaXBhbnQpIHtcbiAgICAgICAgICB0aGlzLm5hbWVQYXJ0aWNpcGFudE1hcC5zZXQoXG4gICAgICAgICAgICByZXNvdXJjZS5tZWRpYUVudHJ5LnBhcnRpY2lwYW50LFxuICAgICAgICAgICAgbmV3UGFydGljaXBhbnQsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmludGVybmFsUGFydGljaXBhbnRNYXAuc2V0KG5ld1BhcnRpY2lwYW50LCBpbnRlcm5hbFBhcnRpY2lwYW50KTtcbiAgICAgICAgLy8gVE9ETzogVXNlIHBhcnRpY2lwYW50IHJlc291cmNlIG5hbWUgaW5zdGVhZCBvZiBpZC5cbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmRlcHJlY2F0aW9uXG4gICAgICAgIGlmIChyZXNvdXJjZS5tZWRpYUVudHJ5LnBhcnRpY2lwYW50SWQpIHtcbiAgICAgICAgICB0aGlzLmlkUGFydGljaXBhbnRNYXAuc2V0KFxuICAgICAgICAgICAgLy8gVE9ETzogVXNlIHBhcnRpY2lwYW50IHJlc291cmNlIG5hbWUgaW5zdGVhZCBvZiBpZC5cbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpkZXByZWNhdGlvblxuICAgICAgICAgICAgcmVzb3VyY2UubWVkaWFFbnRyeS5wYXJ0aWNpcGFudElkLFxuICAgICAgICAgICAgbmV3UGFydGljaXBhbnQsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJ0aWNpcGFudEFycmF5ID0gdGhpcy5wYXJ0aWNpcGFudHNEZWxlZ2F0ZS5nZXQoKTtcbiAgICAgICAgdGhpcy5wYXJ0aWNpcGFudHNEZWxlZ2F0ZS5zZXQoWy4uLnBhcnRpY2lwYW50QXJyYXksIG5ld1BhcnRpY2lwYW50XSk7XG4gICAgICAgIGludGVybmFsTWVkaWFFbnRyeSEucGFydGljaXBhbnQuc2V0KG5ld1BhcnRpY2lwYW50KTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXNvdXJjZS5tZWRpYUVudHJ5LnByZXNlbnRlcikge1xuICAgICAgICB0aGlzLnByZXNlbnRlckRlbGVnYXRlLnNldChtZWRpYUVudHJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICFyZXNvdXJjZS5tZWRpYUVudHJ5LnByZXNlbnRlciAmJlxuICAgICAgICB0aGlzLnByZXNlbnRlckRlbGVnYXRlLmdldCgpID09PSBtZWRpYUVudHJ5XG4gICAgICApIHtcbiAgICAgICAgdGhpcy5wcmVzZW50ZXJEZWxlZ2F0ZS5zZXQodW5kZWZpbmVkKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXNvdXJjZS5tZWRpYUVudHJ5LnNjcmVlbnNoYXJlKSB7XG4gICAgICAgIHRoaXMuc2NyZWVuc2hhcmVEZWxlZ2F0ZS5zZXQobWVkaWFFbnRyeSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAhcmVzb3VyY2UubWVkaWFFbnRyeS5zY3JlZW5zaGFyZSAmJlxuICAgICAgICB0aGlzLnNjcmVlbnNoYXJlRGVsZWdhdGUuZ2V0KCkgPT09IG1lZGlhRW50cnlcbiAgICAgICkge1xuICAgICAgICB0aGlzLnNjcmVlbnNoYXJlRGVsZWdhdGUuc2V0KHVuZGVmaW5lZCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgbWVkaWEgZW50cnkgY29sbGVjdGlvbi5cbiAgICBpZiAoXG4gICAgICAoZGF0YS5yZXNvdXJjZXMgJiYgZGF0YS5yZXNvdXJjZXMubGVuZ3RoID4gMCkgfHxcbiAgICAgIChkYXRhLmRlbGV0ZWRSZXNvdXJjZXMgJiYgZGF0YS5kZWxldGVkUmVzb3VyY2VzLmxlbmd0aCA+IDApXG4gICAgKSB7XG4gICAgICBjb25zdCBuZXdNZWRpYUVudHJ5QXJyYXkgPSBbLi4ubWVkaWFFbnRyeUFycmF5LCAuLi5hZGRlZE1lZGlhRW50cmllc107XG4gICAgICB0aGlzLm1lZGlhRW50cmllc0RlbGVnYXRlLnNldChuZXdNZWRpYUVudHJ5QXJyYXkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaXNNZWRpYUVudHJ5QXNzaWduZWRUb01lZXRTdHJlYW1UcmFjayhcbiAgICBpbnRlcm5hbE1lZGlhRW50cnk6IEludGVybmFsTWVkaWFFbnRyeSxcbiAgKTogYm9vbGVhbiB7XG4gICAgY29uc3QgYXVkaW9TdHJlYW1UcmFjayA9IGludGVybmFsTWVkaWFFbnRyeS5hdWRpb01lZXRTdHJlYW1UcmFjay5nZXQoKTtcbiAgICBpZiAoIWF1ZGlvU3RyZWFtVHJhY2spIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBpbnRlcm5hbEF1ZGlvTWVldFN0cmVhbVRyYWNrID1cbiAgICAgIHRoaXMuaW50ZXJuYWxNZWV0U3RyZWFtVHJhY2tNYXAuZ2V0KGF1ZGlvU3RyZWFtVHJhY2spO1xuICAgIC8vIFRoaXMgaXMgbm90IGV4cGVjdGVkLiBNYXAgc2hvdWxkIGJlIGNvbXByZWhlbnNpdmUgb2YgYWxsIG1lZXQgc3RyZWFtXG4gICAgLy8gdHJhY2tzLlxuICAgIGlmICghaW50ZXJuYWxBdWRpb01lZXRTdHJlYW1UcmFjaykgcmV0dXJuIGZhbHNlO1xuICAgIC8vIFRoZSBBdWRpbyBDUlNDcyBjaGFuZ2VkIGFuZCB0aGVyZWZvcmUgbmVlZCB0byBiZSBjaGVja2VkIGlmIHRoZSBjdXJyZW50XG4gICAgLy8gYXVkaW8gY3NyYyBpcyBpbiB0aGUgY29udHJpYnV0aW5nIHNvdXJjZXMuXG4gICAgY29uc3QgY29udHJpYnV0aW5nU291cmNlczogUlRDUnRwQ29udHJpYnV0aW5nU291cmNlW10gPVxuICAgICAgaW50ZXJuYWxBdWRpb01lZXRTdHJlYW1UcmFjay5yZWNlaXZlci5nZXRDb250cmlidXRpbmdTb3VyY2VzKCk7XG5cbiAgICBmb3IgKGNvbnN0IGNvbnRyaWJ1dGluZ1NvdXJjZSBvZiBjb250cmlidXRpbmdTb3VyY2VzKSB7XG4gICAgICBpZiAoY29udHJpYnV0aW5nU291cmNlLnNvdXJjZSA9PT0gaW50ZXJuYWxNZWRpYUVudHJ5LmF1ZGlvQ3NyYykge1xuICAgICAgICAvLyBBdWRpbyBDc3JjIGZvdW5kIGluIGNvbnRyaWJ1dGluZyBzb3VyY2VzLlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gQXVkaW8gQ3NyYyBub3QgZm91bmQgaW4gY29udHJpYnV0aW5nIHNvdXJjZXMsIHVuYXNzaWduIGF1ZGlvIG1lZXQgc3RyZWFtXG4gICAgLy8gdHJhY2suXG4gICAgaW50ZXJuYWxNZWRpYUVudHJ5LmF1ZGlvTWVldFN0cmVhbVRyYWNrLnNldCh1bmRlZmluZWQpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgYXNzaWduQXVkaW9NZWV0U3RyZWFtVHJhY2soXG4gICAgbWVkaWFFbnRyeTogTWVkaWFFbnRyeSxcbiAgICBpbnRlcm5hbE1lZGlhRW50cnk6IEludGVybmFsTWVkaWFFbnRyeSxcbiAgKSB7XG4gICAgZm9yIChjb25zdCBbXG4gICAgICBtZWV0U3RyZWFtVHJhY2ssXG4gICAgICBpbnRlcm5hbE1lZXRTdHJlYW1UcmFjayxcbiAgICBdIG9mIHRoaXMuaW50ZXJuYWxNZWV0U3RyZWFtVHJhY2tNYXAuZW50cmllcygpKSB7XG4gICAgICAvLyBPbmx5IGF1ZGlvIHRyYWNrcyBhcmUgYXNzaWduZWQgaGVyZS5cbiAgICAgIGlmIChtZWV0U3RyZWFtVHJhY2subWVkaWFTdHJlYW1UcmFjay5raW5kICE9PSAnYXVkaW8nKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHJlY2VpdmVyID0gaW50ZXJuYWxNZWV0U3RyZWFtVHJhY2sucmVjZWl2ZXI7XG4gICAgICBjb25zdCBjb250cmlidXRpbmdTb3VyY2VzOiBSVENSdHBDb250cmlidXRpbmdTb3VyY2VbXSA9XG4gICAgICAgIHJlY2VpdmVyLmdldENvbnRyaWJ1dGluZ1NvdXJjZXMoKTtcbiAgICAgIGZvciAoY29uc3QgY29udHJpYnV0aW5nU291cmNlIG9mIGNvbnRyaWJ1dGluZ1NvdXJjZXMpIHtcbiAgICAgICAgaWYgKGNvbnRyaWJ1dGluZ1NvdXJjZS5zb3VyY2UgPT09IGludGVybmFsTWVkaWFFbnRyeS5hdWRpb0NzcmMpIHtcbiAgICAgICAgICBpbnRlcm5hbE1lZGlhRW50cnkuYXVkaW9NZWV0U3RyZWFtVHJhY2suc2V0KG1lZXRTdHJlYW1UcmFjayk7XG4gICAgICAgICAgaW50ZXJuYWxNZWV0U3RyZWFtVHJhY2subWVkaWFFbnRyeS5zZXQobWVkaWFFbnRyeSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBJZiBBdWRpbyBDc3JjIGlzIG5vdCBmb3VuZCBpbiBjb250cmlidXRpbmcgc291cmNlcywgZmFsbCBiYWNrIHRvXG4gICAgICAvLyBwb2xsaW5nIGZyYW1lcyBmb3IgYXNzaWdubWVudC5cbiAgICAgIGludGVybmFsTWVldFN0cmVhbVRyYWNrLm1heWJlQXNzaWduTWVkaWFFbnRyeU9uRnJhbWUobWVkaWFFbnRyeSwgJ2F1ZGlvJyk7XG4gICAgfVxuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMjQgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQSBjbGFzcyB0byBoYW5kbGUgdGhlIG1lZGlhIHN0YXRzIGNoYW5uZWwuXG4gKi9cblxuaW1wb3J0IHtcbiAgTWVkaWFBcGlSZXNwb25zZVN0YXR1cyxcbiAgTWVkaWFTdGF0c0NoYW5uZWxGcm9tQ2xpZW50LFxuICBNZWRpYVN0YXRzQ2hhbm5lbFRvQ2xpZW50LFxuICBNZWRpYVN0YXRzUmVzb3VyY2UsXG4gIFN0YXRzU2VjdGlvbkRhdGEsXG4gIFVwbG9hZE1lZGlhU3RhdHNSZXF1ZXN0LFxuICBVcGxvYWRNZWRpYVN0YXRzUmVzcG9uc2UsXG59IGZyb20gJy4uLy4uL3R5cGVzL2RhdGFjaGFubmVscyc7XG5pbXBvcnQge0xvZ0xldmVsfSBmcm9tICcuLi8uLi90eXBlcy9lbnVtcyc7XG5pbXBvcnQge0NoYW5uZWxMb2dnZXJ9IGZyb20gJy4vY2hhbm5lbF9sb2dnZXInO1xuXG50eXBlIFN1cHBvcnRlZE1lZGlhU3RhdHNUeXBlcyA9XG4gIHwgJ2NvZGVjJ1xuICB8ICdjYW5kaWRhdGUtcGFpcidcbiAgfCAnbWVkaWEtcGxheW91dCdcbiAgfCAndHJhbnNwb3J0J1xuICB8ICdsb2NhbC1jYW5kaWRhdGUnXG4gIHwgJ3JlbW90ZS1jYW5kaWRhdGUnXG4gIHwgJ2luYm91bmQtcnRwJztcblxuY29uc3QgU1RBVFNfVFlQRV9DT05WRVJURVI6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge1xuICAnY29kZWMnOiAnY29kZWMnLFxuICAnY2FuZGlkYXRlLXBhaXInOiAnY2FuZGlkYXRlX3BhaXInLFxuICAnbWVkaWEtcGxheW91dCc6ICdtZWRpYV9wbGF5b3V0JyxcbiAgJ3RyYW5zcG9ydCc6ICd0cmFuc3BvcnQnLFxuICAnbG9jYWwtY2FuZGlkYXRlJzogJ2xvY2FsX2NhbmRpZGF0ZScsXG4gICdyZW1vdGUtY2FuZGlkYXRlJzogJ3JlbW90ZV9jYW5kaWRhdGUnLFxuICAnaW5ib3VuZC1ydHAnOiAnaW5ib3VuZF9ydHAnLFxufTtcblxuLyoqXG4gKiBIZWxwZXIgY2xhc3MgdG8gaGFuZGxlIHRoZSBtZWRpYSBzdGF0cyBjaGFubmVsLiBUaGlzIGNsYXNzIGlzIHJlc3BvbnNpYmxlXG4gKiBmb3Igc2VuZGluZyBtZWRpYSBzdGF0cyB0byB0aGUgYmFja2VuZCBhbmQgcmVjZWl2aW5nIGNvbmZpZ3VyYXRpb24gdXBkYXRlc1xuICogZnJvbSB0aGUgYmFja2VuZC4gRm9yIHJlYWx0aW1lIG1ldHJpY3Mgd2hlbiBkZWJ1Z2dpbmcgbWFudWFsbHksIHVzZVxuICogY2hyb21lOi8vd2VicnRjLWludGVybmFscy5cbiAqL1xuZXhwb3J0IGNsYXNzIE1lZGlhU3RhdHNDaGFubmVsSGFuZGxlciB7XG4gIC8qKlxuICAgKiBBIG1hcCBvZiBhbGxvd2xpc3RlZCBzZWN0aW9ucy4gVGhlIGtleSBpcyB0aGUgc2VjdGlvbiB0eXBlLCBhbmQgdGhlIHZhbHVlXG4gICAqIGlzIHRoZSBrZXlzIHRoYXQgYXJlIGFsbG93bGlzdGVkIGZvciB0aGF0IHNlY3Rpb24uXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGFsbG93bGlzdCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmdbXT4oKTtcbiAgcHJpdmF0ZSByZXF1ZXN0SWQgPSAxO1xuICBwcml2YXRlIHJlYWRvbmx5IHBlbmRpbmdSZXF1ZXN0UmVzb2x2ZU1hcCA9IG5ldyBNYXA8XG4gICAgbnVtYmVyLFxuICAgICh2YWx1ZTogTWVkaWFBcGlSZXNwb25zZVN0YXR1cykgPT4gdm9pZFxuICA+KCk7XG4gIC8qKiBJZCBmb3IgdGhlIGludGVydmFsIHRvIHNlbmQgbWVkaWEgc3RhdHMuICovXG4gIHByaXZhdGUgaW50ZXJ2YWxJZCA9IDA7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBjaGFubmVsOiBSVENEYXRhQ2hhbm5lbCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHBlZXJDb25uZWN0aW9uOiBSVENQZWVyQ29ubmVjdGlvbixcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNoYW5uZWxMb2dnZXI/OiBDaGFubmVsTG9nZ2VyLFxuICApIHtcbiAgICB0aGlzLmNoYW5uZWwub25tZXNzYWdlID0gKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLm9uTWVkaWFTdGF0c01lc3NhZ2UoZXZlbnQpO1xuICAgIH07XG4gICAgdGhpcy5jaGFubmVsLm9uY2xvc2UgPSAoKSA9PiB7XG4gICAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJZCk7XG4gICAgICB0aGlzLmludGVydmFsSWQgPSAwO1xuICAgICAgdGhpcy5jaGFubmVsTG9nZ2VyPy5sb2coTG9nTGV2ZWwuTUVTU0FHRVMsICdNZWRpYSBzdGF0cyBjaGFubmVsOiBjbG9zZWQnKTtcbiAgICAgIC8vIFJlc29sdmUgYWxsIHBlbmRpbmcgcmVxdWVzdHMgd2l0aCBhbiBlcnJvci5cbiAgICAgIGZvciAoY29uc3QgWywgcmVzb2x2ZV0gb2YgdGhpcy5wZW5kaW5nUmVxdWVzdFJlc29sdmVNYXApIHtcbiAgICAgICAgcmVzb2x2ZSh7Y29kZTogNDAwLCBtZXNzYWdlOiAnQ2hhbm5lbCBjbG9zZWQnLCBkZXRhaWxzOiBbXX0pO1xuICAgICAgfVxuICAgICAgdGhpcy5wZW5kaW5nUmVxdWVzdFJlc29sdmVNYXAuY2xlYXIoKTtcbiAgICB9O1xuICAgIHRoaXMuY2hhbm5lbC5vbm9wZW4gPSAoKSA9PiB7XG4gICAgICB0aGlzLmNoYW5uZWxMb2dnZXI/LmxvZyhMb2dMZXZlbC5NRVNTQUdFUywgJ01lZGlhIHN0YXRzIGNoYW5uZWw6IG9wZW5lZCcpO1xuICAgIH07XG4gIH1cblxuICBwcml2YXRlIG9uTWVkaWFTdGF0c01lc3NhZ2UobWVzc2FnZTogTWVzc2FnZUV2ZW50KSB7XG4gICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UobWVzc2FnZS5kYXRhKSBhcyBNZWRpYVN0YXRzQ2hhbm5lbFRvQ2xpZW50O1xuICAgIGlmIChkYXRhLnJlc3BvbnNlKSB7XG4gICAgICB0aGlzLm9uTWVkaWFTdGF0c1Jlc3BvbnNlKGRhdGEucmVzcG9uc2UpO1xuICAgIH1cbiAgICBpZiAoZGF0YS5yZXNvdXJjZXMpIHtcbiAgICAgIHRoaXMub25NZWRpYVN0YXRzUmVzb3VyY2VzKGRhdGEucmVzb3VyY2VzKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uTWVkaWFTdGF0c1Jlc3BvbnNlKHJlc3BvbnNlOiBVcGxvYWRNZWRpYVN0YXRzUmVzcG9uc2UpIHtcbiAgICB0aGlzLmNoYW5uZWxMb2dnZXI/LmxvZyhcbiAgICAgIExvZ0xldmVsLk1FU1NBR0VTLFxuICAgICAgJ01lZGlhIHN0YXRzIGNoYW5uZWw6IHJlc3BvbnNlIHJlY2VpdmVkJyxcbiAgICAgIHJlc3BvbnNlLFxuICAgICk7XG4gICAgY29uc3QgcmVzb2x2ZSA9IHRoaXMucGVuZGluZ1JlcXVlc3RSZXNvbHZlTWFwLmdldChyZXNwb25zZS5yZXF1ZXN0SWQpO1xuICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICByZXNvbHZlKHJlc3BvbnNlLnN0YXR1cyk7XG4gICAgICB0aGlzLnBlbmRpbmdSZXF1ZXN0UmVzb2x2ZU1hcC5kZWxldGUocmVzcG9uc2UucmVxdWVzdElkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uTWVkaWFTdGF0c1Jlc291cmNlcyhyZXNvdXJjZXM6IE1lZGlhU3RhdHNSZXNvdXJjZVtdKSB7XG4gICAgLy8gV2UgZXhwZWN0IG9ubHkgb25lIHJlc291cmNlIHRvIGJlIHNlbnQuXG4gICAgaWYgKHJlc291cmNlcy5sZW5ndGggPiAxKSB7XG4gICAgICByZXNvdXJjZXMuZm9yRWFjaCgocmVzb3VyY2UpID0+IHtcbiAgICAgICAgdGhpcy5jaGFubmVsTG9nZ2VyPy5sb2coXG4gICAgICAgICAgTG9nTGV2ZWwuRVJST1JTLFxuICAgICAgICAgICdNZWRpYSBzdGF0cyBjaGFubmVsOiBtb3JlIHRoYW4gb25lIHJlc291cmNlIHJlY2VpdmVkJyxcbiAgICAgICAgICByZXNvdXJjZSxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCByZXNvdXJjZSA9IHJlc291cmNlc1swXTtcbiAgICB0aGlzLmNoYW5uZWxMb2dnZXI/LmxvZyhcbiAgICAgIExvZ0xldmVsLk1FU1NBR0VTLFxuICAgICAgJ01lZGlhIHN0YXRzIGNoYW5uZWw6IHJlc291cmNlIHJlY2VpdmVkJyxcbiAgICAgIHJlc291cmNlLFxuICAgICk7XG4gICAgaWYgKHJlc291cmNlLmNvbmZpZ3VyYXRpb24pIHtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKFxuICAgICAgICByZXNvdXJjZS5jb25maWd1cmF0aW9uLmFsbG93bGlzdCxcbiAgICAgICkpIHtcbiAgICAgICAgdGhpcy5hbGxvd2xpc3Quc2V0KGtleSwgdmFsdWUua2V5cyk7XG4gICAgICB9XG4gICAgICAvLyBXZSB3YW50IHRvIHN0b3AgdGhlIGludGVydmFsIGlmIHRoZSB1cGxvYWQgaW50ZXJ2YWwgaXMgemVyb1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLmludGVydmFsSWQgJiZcbiAgICAgICAgcmVzb3VyY2UuY29uZmlndXJhdGlvbi51cGxvYWRJbnRlcnZhbFNlY29uZHMgPT09IDBcbiAgICAgICkge1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJZCk7XG4gICAgICAgIHRoaXMuaW50ZXJ2YWxJZCA9IDA7XG4gICAgICB9XG4gICAgICAvLyBXZSB3YW50IHRvIHN0YXJ0IHRoZSBpbnRlcnZhbCBpZiB0aGUgdXBsb2FkIGludGVydmFsIGlzIG5vdCB6ZXJvLlxuICAgICAgaWYgKHJlc291cmNlLmNvbmZpZ3VyYXRpb24udXBsb2FkSW50ZXJ2YWxTZWNvbmRzKSB7XG4gICAgICAgIC8vIFdlIHdhbnQgdG8gcmVzZXQgdGhlIGludGVydmFsIGlmIHRoZSB1cGxvYWQgaW50ZXJ2YWwgaGFzIGNoYW5nZWQuXG4gICAgICAgIGlmICh0aGlzLmludGVydmFsSWQpIHtcbiAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoXG4gICAgICAgICAgdGhpcy5zZW5kTWVkaWFTdGF0cy5iaW5kKHRoaXMpLFxuICAgICAgICAgIHJlc291cmNlLmNvbmZpZ3VyYXRpb24udXBsb2FkSW50ZXJ2YWxTZWNvbmRzICogMTAwMCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jaGFubmVsTG9nZ2VyPy5sb2coXG4gICAgICAgIExvZ0xldmVsLkVSUk9SUyxcbiAgICAgICAgJ01lZGlhIHN0YXRzIGNoYW5uZWw6IHJlc291cmNlIHJlY2VpdmVkIHdpdGhvdXQgY29uZmlndXJhdGlvbicsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHNlbmRNZWRpYVN0YXRzKCk6IFByb21pc2U8TWVkaWFBcGlSZXNwb25zZVN0YXR1cz4ge1xuICAgIGNvbnN0IHN0YXRzOiBSVENTdGF0c1JlcG9ydCA9IGF3YWl0IHRoaXMucGVlckNvbm5lY3Rpb24uZ2V0U3RhdHMoKTtcbiAgICBjb25zdCByZXF1ZXN0U3RhdHM6IFN0YXRzU2VjdGlvbkRhdGFbXSA9IFtdO1xuXG4gICAgc3RhdHMuZm9yRWFjaChcbiAgICAgIChcbiAgICAgICAgcmVwb3J0OlxuICAgICAgICAgIHwgUlRDVHJhbnNwb3J0U3RhdHNcbiAgICAgICAgICB8IFJUQ0ljZUNhbmRpZGF0ZVBhaXJTdGF0c1xuICAgICAgICAgIHwgUlRDT3V0Ym91bmRSdHBTdHJlYW1TdGF0c1xuICAgICAgICAgIHwgUlRDSW5ib3VuZFJ0cFN0cmVhbVN0YXRzLFxuICAgICAgKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXRzVHlwZSA9IHJlcG9ydC50eXBlIGFzIFN1cHBvcnRlZE1lZGlhU3RhdHNUeXBlcztcbiAgICAgICAgaWYgKHN0YXRzVHlwZSAmJiB0aGlzLmFsbG93bGlzdC5oYXMocmVwb3J0LnR5cGUpKSB7XG4gICAgICAgICAgY29uc3QgZmlsdGVyZWRNZWRpYVN0YXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyfSA9IHt9O1xuICAgICAgICAgIE9iamVjdC5lbnRyaWVzKHJlcG9ydCkuZm9yRWFjaCgoZW50cnkpID0+IHtcbiAgICAgICAgICAgIC8vIGlkIGlzIG5vdCBhY2NlcHRlZCB3aXRoIG90aGVyIHN0YXRzLiBJdCBpcyBwb3B1bGF0ZWQgaW4gdGhlIHRvcFxuICAgICAgICAgICAgLy8gbGV2ZWwgc2VjdGlvbi5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdGhpcy5hbGxvd2xpc3QuZ2V0KHJlcG9ydC50eXBlKT8uaW5jbHVkZXMoZW50cnlbMF0pICYmXG4gICAgICAgICAgICAgIGVudHJ5WzBdICE9PSAnaWQnXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgLy8gV2Ugd2FudCB0byBjb252ZXJ0IHRoZSBjYW1lbCBjYXNlIHRvIHVuZGVyc2NvcmUuXG4gICAgICAgICAgICAgIGZpbHRlcmVkTWVkaWFTdGF0c1t0aGlzLmNhbWVsVG9VbmRlcnNjb3JlKGVudHJ5WzBdKV0gPSBlbnRyeVsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb25zdCBmaWx0ZXJlZE1lZGlhU3RhdHNEaWN0aW9uYXJ5ID0ge1xuICAgICAgICAgICAgJ2lkJzogcmVwb3J0LmlkLFxuICAgICAgICAgICAgW1NUQVRTX1RZUEVfQ09OVkVSVEVSW3JlcG9ydC50eXBlIGFzIHN0cmluZ11dOiBmaWx0ZXJlZE1lZGlhU3RhdHMsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBjb25zdCBmaWx0ZXJlZFN0YXRzU2VjdGlvbkRhdGEgPVxuICAgICAgICAgICAgZmlsdGVyZWRNZWRpYVN0YXRzRGljdGlvbmFyeSBhcyBTdGF0c1NlY3Rpb25EYXRhO1xuXG4gICAgICAgICAgcmVxdWVzdFN0YXRzLnB1c2goZmlsdGVyZWRTdGF0c1NlY3Rpb25EYXRhKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKCFyZXF1ZXN0U3RhdHMubGVuZ3RoKSB7XG4gICAgICB0aGlzLmNoYW5uZWxMb2dnZXI/LmxvZyhcbiAgICAgICAgTG9nTGV2ZWwuRVJST1JTLFxuICAgICAgICAnTWVkaWEgc3RhdHMgY2hhbm5lbDogbm8gbWVkaWEgc3RhdHMgdG8gc2VuZCcsXG4gICAgICApO1xuICAgICAgcmV0dXJuIHtjb2RlOiA0MDAsIG1lc3NhZ2U6ICdObyBtZWRpYSBzdGF0cyB0byBzZW5kJywgZGV0YWlsczogW119O1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNoYW5uZWwucmVhZHlTdGF0ZSA9PT0gJ29wZW4nKSB7XG4gICAgICBjb25zdCBtZWRpYVN0YXRzUmVxdWVzdDogVXBsb2FkTWVkaWFTdGF0c1JlcXVlc3QgPSB7XG4gICAgICAgIHJlcXVlc3RJZDogdGhpcy5yZXF1ZXN0SWQsXG4gICAgICAgIHVwbG9hZE1lZGlhU3RhdHM6IHtzZWN0aW9uczogcmVxdWVzdFN0YXRzfSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlcXVlc3Q6IE1lZGlhU3RhdHNDaGFubmVsRnJvbUNsaWVudCA9IHtcbiAgICAgICAgcmVxdWVzdDogbWVkaWFTdGF0c1JlcXVlc3QsXG4gICAgICB9O1xuICAgICAgdGhpcy5jaGFubmVsTG9nZ2VyPy5sb2coXG4gICAgICAgIExvZ0xldmVsLk1FU1NBR0VTLFxuICAgICAgICAnTWVkaWEgc3RhdHMgY2hhbm5lbDogc2VuZGluZyByZXF1ZXN0JyxcbiAgICAgICAgbWVkaWFTdGF0c1JlcXVlc3QsXG4gICAgICApO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5jaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkocmVxdWVzdCkpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmNoYW5uZWxMb2dnZXI/LmxvZyhcbiAgICAgICAgICBMb2dMZXZlbC5FUlJPUlMsXG4gICAgICAgICAgJ01lZGlhIHN0YXRzIGNoYW5uZWw6IEZhaWxlZCB0byBzZW5kIHJlcXVlc3Qgd2l0aCBlcnJvcicsXG4gICAgICAgICAgZSBhcyBFcnJvcixcbiAgICAgICAgKTtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZXF1ZXN0SWQrKztcbiAgICAgIGNvbnN0IHJlcXVlc3RQcm9taXNlID0gbmV3IFByb21pc2U8TWVkaWFBcGlSZXNwb25zZVN0YXR1cz4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgdGhpcy5wZW5kaW5nUmVxdWVzdFJlc29sdmVNYXAuc2V0KG1lZGlhU3RhdHNSZXF1ZXN0LnJlcXVlc3RJZCwgcmVzb2x2ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXF1ZXN0UHJvbWlzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsSWQpO1xuICAgICAgdGhpcy5pbnRlcnZhbElkID0gMDtcbiAgICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgICBMb2dMZXZlbC5FUlJPUlMsXG4gICAgICAgICdNZWRpYSBzdGF0cyBjaGFubmVsOiBoYW5kbGVyIHRyaWVkIHRvIHNlbmQgbWVzc2FnZSB3aGVuIGNoYW5uZWwgd2FzIGNsb3NlZCcsXG4gICAgICApO1xuICAgICAgcmV0dXJuIHtjb2RlOiA0MDAsIG1lc3NhZ2U6ICdDaGFubmVsIGlzIG5vdCBvcGVuJywgZGV0YWlsczogW119O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY2FtZWxUb1VuZGVyc2NvcmUodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC8oW0EtWl0pL2csICdfJDEnKS50b0xvd2VyQ2FzZSgpO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMjQgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgSGFuZGxlcyBwYXJ0aWNpcGFudHMgZGF0YSBjaGFubmVsIHVwZGF0ZXNcbiAqL1xuXG5pbXBvcnQge1xuICBEZWxldGVkUGFydGljaXBhbnQsXG4gIFBhcnRpY2lwYW50UmVzb3VyY2UsXG4gIFBhcnRpY2lwYW50c0NoYW5uZWxUb0NsaWVudCxcbn0gZnJvbSAnLi4vLi4vdHlwZXMvZGF0YWNoYW5uZWxzJztcbmltcG9ydCB7TG9nTGV2ZWx9IGZyb20gJy4uLy4uL3R5cGVzL2VudW1zJztcbmltcG9ydCB7XG4gIFBhcnRpY2lwYW50IGFzIExvY2FsUGFydGljaXBhbnQsXG4gIE1lZGlhRW50cnksXG59IGZyb20gJy4uLy4uL3R5cGVzL21lZGlhdHlwZXMnO1xuaW1wb3J0IHtJbnRlcm5hbE1lZGlhRW50cnksIEludGVybmFsUGFydGljaXBhbnR9IGZyb20gJy4uL2ludGVybmFsX3R5cGVzJztcbmltcG9ydCB7U3Vic2NyaWJhYmxlRGVsZWdhdGV9IGZyb20gJy4uL3N1YnNjcmliYWJsZV9pbXBsJztcbmltcG9ydCB7Q2hhbm5lbExvZ2dlcn0gZnJvbSAnLi9jaGFubmVsX2xvZ2dlcic7XG5cbi8qKlxuICogSGFuZGxlciBmb3IgcGFydGljaXBhbnRzIGNoYW5uZWxcbiAqL1xuZXhwb3J0IGNsYXNzIFBhcnRpY2lwYW50c0NoYW5uZWxIYW5kbGVyIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBjaGFubmVsOiBSVENEYXRhQ2hhbm5lbCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHBhcnRpY2lwYW50c0RlbGVnYXRlOiBTdWJzY3JpYmFibGVEZWxlZ2F0ZTxcbiAgICAgIExvY2FsUGFydGljaXBhbnRbXVxuICAgID4sXG4gICAgcHJpdmF0ZSByZWFkb25seSBpZFBhcnRpY2lwYW50TWFwID0gbmV3IE1hcDxudW1iZXIsIExvY2FsUGFydGljaXBhbnQ+KCksXG4gICAgcHJpdmF0ZSByZWFkb25seSBuYW1lUGFydGljaXBhbnRNYXAgPSBuZXcgTWFwPHN0cmluZywgTG9jYWxQYXJ0aWNpcGFudD4oKSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGludGVybmFsUGFydGljaXBhbnRNYXAgPSBuZXcgTWFwPFxuICAgICAgTG9jYWxQYXJ0aWNpcGFudCxcbiAgICAgIEludGVybmFsUGFydGljaXBhbnRcbiAgICA+KCksXG4gICAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbE1lZGlhRW50cnlNYXAgPSBuZXcgTWFwPFxuICAgICAgTWVkaWFFbnRyeSxcbiAgICAgIEludGVybmFsTWVkaWFFbnRyeVxuICAgID4oKSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNoYW5uZWxMb2dnZXI/OiBDaGFubmVsTG9nZ2VyLFxuICApIHtcbiAgICB0aGlzLmNoYW5uZWwub25tZXNzYWdlID0gKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLm9uUGFydGljaXBhbnRzTWVzc2FnZShldmVudCk7XG4gICAgfTtcbiAgICB0aGlzLmNoYW5uZWwub25vcGVuID0gKCkgPT4ge1xuICAgICAgdGhpcy5vblBhcnRpY2lwYW50c09wZW5lZCgpO1xuICAgIH07XG4gICAgdGhpcy5jaGFubmVsLm9uY2xvc2UgPSAoKSA9PiB7XG4gICAgICB0aGlzLm9uUGFydGljaXBhbnRzQ2xvc2VkKCk7XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgb25QYXJ0aWNpcGFudHNPcGVuZWQoKSB7XG4gICAgdGhpcy5jaGFubmVsTG9nZ2VyPy5sb2coTG9nTGV2ZWwuTUVTU0FHRVMsICdQYXJ0aWNpcGFudHMgY2hhbm5lbDogb3BlbmVkJyk7XG4gIH1cblxuICBwcml2YXRlIG9uUGFydGljaXBhbnRzTWVzc2FnZShldmVudDogTWVzc2FnZUV2ZW50KSB7XG4gICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSkgYXMgUGFydGljaXBhbnRzQ2hhbm5lbFRvQ2xpZW50O1xuICAgIGxldCBwYXJ0aWNpcGFudHMgPSB0aGlzLnBhcnRpY2lwYW50c0RlbGVnYXRlLmdldCgpO1xuICAgIGRhdGEuZGVsZXRlZFJlc291cmNlcz8uZm9yRWFjaCgoZGVsZXRlZFJlc291cmNlOiBEZWxldGVkUGFydGljaXBhbnQpID0+IHtcbiAgICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgICBMb2dMZXZlbC5SRVNPVVJDRVMsXG4gICAgICAgICdQYXJ0aWNpcGFudHMgY2hhbm5lbDogZGVsZXRlZCByZXNvdXJjZScsXG4gICAgICAgIGRlbGV0ZWRSZXNvdXJjZSxcbiAgICAgICk7XG4gICAgICBjb25zdCBwYXJ0aWNpcGFudCA9IHRoaXMuaWRQYXJ0aWNpcGFudE1hcC5nZXQoZGVsZXRlZFJlc291cmNlLmlkKTtcbiAgICAgIGlmICghcGFydGljaXBhbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5pZFBhcnRpY2lwYW50TWFwLmRlbGV0ZShkZWxldGVkUmVzb3VyY2UuaWQpO1xuICAgICAgY29uc3QgZGVsZXRlZFBhcnRpY2lwYW50ID0gdGhpcy5pbnRlcm5hbFBhcnRpY2lwYW50TWFwLmdldChwYXJ0aWNpcGFudCk7XG4gICAgICBpZiAoIWRlbGV0ZWRQYXJ0aWNpcGFudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBkZWxldGVkUGFydGljaXBhbnQuaWRzLmRlbGV0ZShkZWxldGVkUmVzb3VyY2UuaWQpO1xuICAgICAgaWYgKGRlbGV0ZWRQYXJ0aWNpcGFudC5pZHMuc2l6ZSAhPT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAocGFydGljaXBhbnQucGFydGljaXBhbnQubmFtZSkge1xuICAgICAgICB0aGlzLm5hbWVQYXJ0aWNpcGFudE1hcC5kZWxldGUocGFydGljaXBhbnQucGFydGljaXBhbnQubmFtZSk7XG4gICAgICB9XG4gICAgICBwYXJ0aWNpcGFudHMgPSBwYXJ0aWNpcGFudHMuZmlsdGVyKChwKSA9PiBwICE9PSBwYXJ0aWNpcGFudCk7XG4gICAgICB0aGlzLmludGVybmFsUGFydGljaXBhbnRNYXAuZGVsZXRlKHBhcnRpY2lwYW50KTtcbiAgICAgIGRlbGV0ZWRQYXJ0aWNpcGFudC5tZWRpYUVudHJpZXMuZ2V0KCkuZm9yRWFjaCgobWVkaWFFbnRyeSkgPT4ge1xuICAgICAgICBjb25zdCBpbnRlcm5hbE1lZGlhRW50cnkgPSB0aGlzLmludGVybmFsTWVkaWFFbnRyeU1hcC5nZXQobWVkaWFFbnRyeSk7XG4gICAgICAgIGlmIChpbnRlcm5hbE1lZGlhRW50cnkpIHtcbiAgICAgICAgICBpbnRlcm5hbE1lZGlhRW50cnkucGFydGljaXBhbnQuc2V0KHVuZGVmaW5lZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29uc3QgYWRkZWRQYXJ0aWNpcGFudHM6IExvY2FsUGFydGljaXBhbnRbXSA9IFtdO1xuICAgIGRhdGEucmVzb3VyY2VzPy5mb3JFYWNoKChyZXNvdXJjZTogUGFydGljaXBhbnRSZXNvdXJjZSkgPT4ge1xuICAgICAgdGhpcy5jaGFubmVsTG9nZ2VyPy5sb2coXG4gICAgICAgIExvZ0xldmVsLlJFU09VUkNFUyxcbiAgICAgICAgJ1BhcnRpY2lwYW50cyBjaGFubmVsOiBhZGRlZCByZXNvdXJjZScsXG4gICAgICAgIHJlc291cmNlLFxuICAgICAgKTtcbiAgICAgIGlmICghcmVzb3VyY2UuaWQpIHtcbiAgICAgICAgLy8gV2UgZXhwZWN0IGFsbCBwYXJ0aWNpcGFudHMgdG8gaGF2ZSBhbiBpZC4gSWYgbm90LCB3ZSBsb2cgYW4gZXJyb3JcbiAgICAgICAgLy8gYW5kIGlnbm9yZSB0aGUgcGFydGljaXBhbnQuXG4gICAgICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgICAgIExvZ0xldmVsLkVSUk9SUyxcbiAgICAgICAgICAnUGFydGljaXBhbnRzIGNoYW5uZWw6IHBhcnRpY2lwYW50IHJlc291cmNlIGhhcyBubyBpZCcsXG4gICAgICAgICAgcmVzb3VyY2UsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIFdlIGRvIG5vdCBleHBlY3QgdGhhdCB0aGUgcGFydGljaXBhbnQgcmVzb3VyY2UgYWxyZWFkeSBleGlzdHMuXG4gICAgICAvLyBIb3dldmVyLCBpdCBpcyBwb3NzaWJsZSB0aGF0IHRoZSBtZWRpYSBlbnRyaWVzIGNoYW5uZWwgcmVmZXJlbmNlcyBpdFxuICAgICAgLy8gYmVmb3JlIHdlIHJlY2VpdmUgdGhlIHBhcnRpY2lwYW50IHJlc291cmNlLiBJbiB0aGlzIGNhc2UsIHdlIHVwZGF0ZVxuICAgICAgLy8gdGhlIHBhcnRpY2lwYW50IHJlc291cmNlIHdpdGggdGhlIHR5cGUgYW5kIG1haW50YWluIHRoZSBtZWRpYSBlbnRyeVxuICAgICAgLy8gcmVsYXRpb25zaGlwLlxuICAgICAgbGV0IGV4aXN0aW5nTWVkaWFFbnRyaWVzRGVsZWdhdGU6XG4gICAgICAgIHwgU3Vic2NyaWJhYmxlRGVsZWdhdGU8TWVkaWFFbnRyeVtdPlxuICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgIGxldCBleGlzdGluZ1BhcnRpY2lwYW50OiBMb2NhbFBhcnRpY2lwYW50IHwgdW5kZWZpbmVkO1xuICAgICAgbGV0IGV4aXN0aW5nSWRzOiBTZXQ8bnVtYmVyPiB8IHVuZGVmaW5lZDtcbiAgICAgIGlmICh0aGlzLmlkUGFydGljaXBhbnRNYXAuaGFzKHJlc291cmNlLmlkKSkge1xuICAgICAgICBleGlzdGluZ1BhcnRpY2lwYW50ID0gdGhpcy5pZFBhcnRpY2lwYW50TWFwLmdldChyZXNvdXJjZS5pZCk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICByZXNvdXJjZS5wYXJ0aWNpcGFudC5uYW1lICYmXG4gICAgICAgIHRoaXMubmFtZVBhcnRpY2lwYW50TWFwLmhhcyhyZXNvdXJjZS5wYXJ0aWNpcGFudC5uYW1lKVxuICAgICAgKSB7XG4gICAgICAgIGV4aXN0aW5nUGFydGljaXBhbnQgPSB0aGlzLm5hbWVQYXJ0aWNpcGFudE1hcC5nZXQoXG4gICAgICAgICAgcmVzb3VyY2UucGFydGljaXBhbnQubmFtZSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAocmVzb3VyY2UucGFydGljaXBhbnQucGFydGljaXBhbnRLZXkpIHtcbiAgICAgICAgZXhpc3RpbmdQYXJ0aWNpcGFudCA9IEFycmF5LmZyb20oXG4gICAgICAgICAgdGhpcy5pbnRlcm5hbFBhcnRpY2lwYW50TWFwLmVudHJpZXMoKSxcbiAgICAgICAgKS5maW5kKFxuICAgICAgICAgIChbcGFydGljaXBhbnQsIF9dKSA9PlxuICAgICAgICAgICAgcGFydGljaXBhbnQucGFydGljaXBhbnQucGFydGljaXBhbnRLZXkgPT09XG4gICAgICAgICAgICByZXNvdXJjZS5wYXJ0aWNpcGFudC5wYXJ0aWNpcGFudEtleSxcbiAgICAgICAgKT8uWzBdO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXhpc3RpbmdQYXJ0aWNpcGFudCkge1xuICAgICAgICBjb25zdCBpbnRlcm5hbFBhcnRpY2lwYW50ID1cbiAgICAgICAgICB0aGlzLmludGVybmFsUGFydGljaXBhbnRNYXAuZ2V0KGV4aXN0aW5nUGFydGljaXBhbnQpO1xuICAgICAgICBpZiAoaW50ZXJuYWxQYXJ0aWNpcGFudCkge1xuICAgICAgICAgIGV4aXN0aW5nTWVkaWFFbnRyaWVzRGVsZWdhdGUgPSBpbnRlcm5hbFBhcnRpY2lwYW50Lm1lZGlhRW50cmllcztcbiAgICAgICAgICAvLyAoVE9ETzogUmVtb3ZlIHRoaXMgb25jZSB3ZSBhcmUgdXNpbmcgcGFydGljaXBhbnRcbiAgICAgICAgICAvLyBuYW1lcyBhcyBpZGVudGlmaWVycy4gUmlnaHQgbm93LCBpdCBpcyBwb3NzaWJsZSBmb3IgYSBwYXJ0aWNpcGFudCB0b1xuICAgICAgICAgIC8vIGhhdmUgbXVsdGlwbGUgaWRzIGR1ZSB0byB1cGRhdGVzIGJlaW5nIHRyZWF0ZWQgYXMgbmV3IHJlc291cmNlcy5cbiAgICAgICAgICBleGlzdGluZ0lkcyA9IGludGVybmFsUGFydGljaXBhbnQuaWRzO1xuICAgICAgICAgIGV4aXN0aW5nSWRzLmZvckVhY2goKGlkKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmlkUGFydGljaXBhbnRNYXAuZGVsZXRlKGlkKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXhpc3RpbmdQYXJ0aWNpcGFudC5wYXJ0aWNpcGFudC5uYW1lKSB7XG4gICAgICAgICAgdGhpcy5uYW1lUGFydGljaXBhbnRNYXAuZGVsZXRlKGV4aXN0aW5nUGFydGljaXBhbnQucGFydGljaXBhbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbnRlcm5hbFBhcnRpY2lwYW50TWFwLmRlbGV0ZShleGlzdGluZ1BhcnRpY2lwYW50KTtcbiAgICAgICAgcGFydGljaXBhbnRzID0gcGFydGljaXBhbnRzLmZpbHRlcigocCkgPT4gcCAhPT0gZXhpc3RpbmdQYXJ0aWNpcGFudCk7XG4gICAgICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgICAgIExvZ0xldmVsLkVSUk9SUyxcbiAgICAgICAgICAnUGFydGljaXBhbnRzIGNoYW5uZWw6IHBhcnRpY2lwYW50IHJlc291cmNlIGFscmVhZHkgZXhpc3RzJyxcbiAgICAgICAgICByZXNvdXJjZSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcGFydGljaXBhbnRFbGVtZW50ID0gY3JlYXRlUGFydGljaXBhbnQoXG4gICAgICAgIHJlc291cmNlLFxuICAgICAgICBleGlzdGluZ01lZGlhRW50cmllc0RlbGVnYXRlLFxuICAgICAgICBleGlzdGluZ0lkcyxcbiAgICAgICk7XG4gICAgICBjb25zdCBwYXJ0aWNpcGFudCA9IHBhcnRpY2lwYW50RWxlbWVudC5wYXJ0aWNpcGFudDtcbiAgICAgIGNvbnN0IGludGVybmFsUGFydGljaXBhbnQgPSBwYXJ0aWNpcGFudEVsZW1lbnQuaW50ZXJuYWxQYXJ0aWNpcGFudDtcbiAgICAgIHBhcnRpY2lwYW50RWxlbWVudC5pbnRlcm5hbFBhcnRpY2lwYW50Lmlkcy5mb3JFYWNoKChpZCkgPT4ge1xuICAgICAgICB0aGlzLmlkUGFydGljaXBhbnRNYXAuc2V0KGlkLCBwYXJ0aWNpcGFudCk7XG4gICAgICB9KTtcbiAgICAgIGlmIChyZXNvdXJjZS5wYXJ0aWNpcGFudC5uYW1lKSB7XG4gICAgICAgIHRoaXMubmFtZVBhcnRpY2lwYW50TWFwLnNldChyZXNvdXJjZS5wYXJ0aWNpcGFudC5uYW1lLCBwYXJ0aWNpcGFudCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuaW50ZXJuYWxQYXJ0aWNpcGFudE1hcC5zZXQocGFydGljaXBhbnQsIGludGVybmFsUGFydGljaXBhbnQpO1xuICAgICAgYWRkZWRQYXJ0aWNpcGFudHMucHVzaChwYXJ0aWNpcGFudCk7XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgcGFydGljaXBhbnQgY29sbGVjdGlvbi5cbiAgICBpZiAoZGF0YS5yZXNvdXJjZXM/Lmxlbmd0aCB8fCBkYXRhLmRlbGV0ZWRSZXNvdXJjZXM/Lmxlbmd0aCkge1xuICAgICAgY29uc3QgbmV3UGFydGljaXBhbnRzID0gWy4uLnBhcnRpY2lwYW50cywgLi4uYWRkZWRQYXJ0aWNpcGFudHNdO1xuICAgICAgdGhpcy5wYXJ0aWNpcGFudHNEZWxlZ2F0ZS5zZXQobmV3UGFydGljaXBhbnRzKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uUGFydGljaXBhbnRzQ2xvc2VkKCkge1xuICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKExvZ0xldmVsLk1FU1NBR0VTLCAnUGFydGljaXBhbnRzIGNoYW5uZWw6IGNsb3NlZCcpO1xuICB9XG59XG5cbmludGVyZmFjZSBJbnRlcm5hbFBhcnRpY2lwYW50RWxlbWVudCB7XG4gIHBhcnRpY2lwYW50OiBMb2NhbFBhcnRpY2lwYW50O1xuICBpbnRlcm5hbFBhcnRpY2lwYW50OiBJbnRlcm5hbFBhcnRpY2lwYW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgcGFydGljaXBhbnQuXG4gKiBAcmV0dXJuIFRoZSBuZXcgcGFydGljaXBhbnQgYW5kIGl0cyBpbnRlcm5hbCByZXByZXNlbnRhdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUGFydGljaXBhbnQoXG4gIHJlc291cmNlOiBQYXJ0aWNpcGFudFJlc291cmNlLFxuICBtZWRpYUVudHJpZXNEZWxlZ2F0ZSA9IG5ldyBTdWJzY3JpYmFibGVEZWxlZ2F0ZTxNZWRpYUVudHJ5W10+KFtdKSxcbiAgZXhpc3RpbmdJZHMgPSBuZXcgU2V0PG51bWJlcj4oKSxcbik6IEludGVybmFsUGFydGljaXBhbnRFbGVtZW50IHtcbiAgaWYgKCFyZXNvdXJjZS5pZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGFydGljaXBhbnQgcmVzb3VyY2UgbXVzdCBoYXZlIGFuIGlkJyk7XG4gIH1cblxuICBjb25zdCBwYXJ0aWNpcGFudDogTG9jYWxQYXJ0aWNpcGFudCA9IHtcbiAgICBwYXJ0aWNpcGFudDogcmVzb3VyY2UucGFydGljaXBhbnQsXG4gICAgbWVkaWFFbnRyaWVzOiBtZWRpYUVudHJpZXNEZWxlZ2F0ZS5nZXRTdWJzY3JpYmFibGUoKSxcbiAgfTtcblxuICBleGlzdGluZ0lkcy5hZGQocmVzb3VyY2UuaWQpO1xuXG4gIGNvbnN0IGludGVybmFsUGFydGljaXBhbnQ6IEludGVybmFsUGFydGljaXBhbnQgPSB7XG4gICAgbmFtZTogcmVzb3VyY2UucGFydGljaXBhbnQubmFtZSA/PyAnJyxcbiAgICBpZHM6IGV4aXN0aW5nSWRzLFxuICAgIG1lZGlhRW50cmllczogbWVkaWFFbnRyaWVzRGVsZWdhdGUsXG4gIH07XG4gIHJldHVybiB7XG4gICAgcGFydGljaXBhbnQsXG4gICAgaW50ZXJuYWxQYXJ0aWNpcGFudCxcbiAgfTtcbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAyNCBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogQGZpbGVvdmVydmlldyBIYW5kbGVzIHRoZSBzZXNzaW9uIGNvbnRyb2wgY2hhbm5lbC5cbiAqL1xuXG5pbXBvcnQge1xuICBMZWF2ZVJlcXVlc3QsXG4gIFNlc3Npb25Db250cm9sQ2hhbm5lbEZyb21DbGllbnQsXG4gIFNlc3Npb25Db250cm9sQ2hhbm5lbFRvQ2xpZW50LFxufSBmcm9tICcuLi8uLi90eXBlcy9kYXRhY2hhbm5lbHMnO1xuaW1wb3J0IHtcbiAgTG9nTGV2ZWwsXG4gIE1lZXRDb25uZWN0aW9uU3RhdGUsXG4gIE1lZXREaXNjb25uZWN0UmVhc29uLFxufSBmcm9tICcuLi8uLi90eXBlcy9lbnVtcyc7XG5pbXBvcnQge01lZXRTZXNzaW9uU3RhdHVzfSBmcm9tICcuLi8uLi90eXBlcy9tZWV0bWVkaWFhcGljbGllbnQnO1xuaW1wb3J0IHtTdWJzY3JpYmFibGVEZWxlZ2F0ZX0gZnJvbSAnLi4vc3Vic2NyaWJhYmxlX2ltcGwnO1xuaW1wb3J0IHtDaGFubmVsTG9nZ2VyfSBmcm9tICcuL2NoYW5uZWxfbG9nZ2VyJztcblxuY29uc3QgRElTQ09OTkVDVF9SRUFTT05fTUFQID0gbmV3IE1hcDxzdHJpbmcsIE1lZXREaXNjb25uZWN0UmVhc29uPihbXG4gIFsnUkVBU09OX0NMSUVOVF9MRUZUJywgTWVldERpc2Nvbm5lY3RSZWFzb24uQ0xJRU5UX0xFRlRdLFxuICBbJ1JFQVNPTl9VU0VSX1NUT1BQRUQnLCBNZWV0RGlzY29ubmVjdFJlYXNvbi5VU0VSX1NUT1BQRURdLFxuICBbJ1JFQVNPTl9DT05GRVJFTkNFX0VOREVEJywgTWVldERpc2Nvbm5lY3RSZWFzb24uQ09ORkVSRU5DRV9FTkRFRF0sXG4gIFsnUkVBU09OX1NFU1NJT05fVU5IRUFMVEhZJywgTWVldERpc2Nvbm5lY3RSZWFzb24uU0VTU0lPTl9VTkhFQUxUSFldLFxuXSk7XG5cbi8qKlxuICogSGVscGVyIGNsYXNzIHRvIGhhbmRsZXMgdGhlIHNlc3Npb24gY29udHJvbCBjaGFubmVsLlxuICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkNvbnRyb2xDaGFubmVsSGFuZGxlciB7XG4gIHByaXZhdGUgcmVxdWVzdElkID0gMTtcbiAgcHJpdmF0ZSBsZWF2ZVNlc3Npb25Qcm9taXNlOiAoKCkgPT4gdm9pZCkgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBjaGFubmVsOiBSVENEYXRhQ2hhbm5lbCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNlc3Npb25TdGF0dXNEZWxlZ2F0ZTogU3Vic2NyaWJhYmxlRGVsZWdhdGU8TWVldFNlc3Npb25TdGF0dXM+LFxuICAgIHByaXZhdGUgcmVhZG9ubHkgY2hhbm5lbExvZ2dlcj86IENoYW5uZWxMb2dnZXIsXG4gICkge1xuICAgIHRoaXMuY2hhbm5lbC5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMub25TZXNzaW9uQ29udHJvbE1lc3NhZ2UoZXZlbnQpO1xuICAgIH07XG4gICAgdGhpcy5jaGFubmVsLm9ub3BlbiA9ICgpID0+IHtcbiAgICAgIHRoaXMub25TZXNzaW9uQ29udHJvbE9wZW5lZCgpO1xuICAgIH07XG4gICAgdGhpcy5jaGFubmVsLm9uY2xvc2UgPSAoKSA9PiB7XG4gICAgICB0aGlzLm9uU2Vzc2lvbkNvbnRyb2xDbG9zZWQoKTtcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBvblNlc3Npb25Db250cm9sT3BlbmVkKCkge1xuICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgTG9nTGV2ZWwuTUVTU0FHRVMsXG4gICAgICAnU2Vzc2lvbiBjb250cm9sIGNoYW5uZWw6IG9wZW5lZCcsXG4gICAgKTtcbiAgICB0aGlzLnNlc3Npb25TdGF0dXNEZWxlZ2F0ZS5zZXQoe1xuICAgICAgY29ubmVjdGlvblN0YXRlOiBNZWV0Q29ubmVjdGlvblN0YXRlLldBSVRJTkcsXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIG9uU2Vzc2lvbkNvbnRyb2xNZXNzYWdlKGV2ZW50OiBNZXNzYWdlRXZlbnQpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gZXZlbnQuZGF0YTtcbiAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZShtZXNzYWdlKSBhcyBTZXNzaW9uQ29udHJvbENoYW5uZWxUb0NsaWVudDtcbiAgICBpZiAoanNvbj8ucmVzcG9uc2UpIHtcbiAgICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgICBMb2dMZXZlbC5NRVNTQUdFUyxcbiAgICAgICAgJ1Nlc3Npb24gY29udHJvbCBjaGFubmVsOiByZXNwb25zZSByZWNpZXZlZCcsXG4gICAgICAgIGpzb24ucmVzcG9uc2UsXG4gICAgICApO1xuICAgICAgdGhpcy5sZWF2ZVNlc3Npb25Qcm9taXNlPy4oKTtcbiAgICB9XG4gICAgaWYgKGpzb24/LnJlc291cmNlcyAmJiBqc29uLnJlc291cmNlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBzZXNzaW9uU3RhdHVzID0ganNvbi5yZXNvdXJjZXNbMF0uc2Vzc2lvblN0YXR1cztcbiAgICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgICBMb2dMZXZlbC5SRVNPVVJDRVMsXG4gICAgICAgICdTZXNzaW9uIGNvbnRyb2wgY2hhbm5lbDogcmVzb3VyY2UgcmVjaWV2ZWQnLFxuICAgICAgICBqc29uLnJlc291cmNlc1swXSxcbiAgICAgICk7XG4gICAgICBpZiAoc2Vzc2lvblN0YXR1cy5jb25uZWN0aW9uU3RhdGUgPT09ICdTVEFURV9XQUlUSU5HJykge1xuICAgICAgICB0aGlzLnNlc3Npb25TdGF0dXNEZWxlZ2F0ZS5zZXQoe1xuICAgICAgICAgIGNvbm5lY3Rpb25TdGF0ZTogTWVldENvbm5lY3Rpb25TdGF0ZS5XQUlUSU5HLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoc2Vzc2lvblN0YXR1cy5jb25uZWN0aW9uU3RhdGUgPT09ICdTVEFURV9KT0lORUQnKSB7XG4gICAgICAgIHRoaXMuc2Vzc2lvblN0YXR1c0RlbGVnYXRlLnNldCh7XG4gICAgICAgICAgY29ubmVjdGlvblN0YXRlOiBNZWV0Q29ubmVjdGlvblN0YXRlLkpPSU5FRCxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKHNlc3Npb25TdGF0dXMuY29ubmVjdGlvblN0YXRlID09PSAnU1RBVEVfRElTQ09OTkVDVEVEJykge1xuICAgICAgICB0aGlzLnNlc3Npb25TdGF0dXNEZWxlZ2F0ZS5zZXQoe1xuICAgICAgICAgIGNvbm5lY3Rpb25TdGF0ZTogTWVldENvbm5lY3Rpb25TdGF0ZS5ESVNDT05ORUNURUQsXG4gICAgICAgICAgZGlzY29ubmVjdFJlYXNvbjpcbiAgICAgICAgICAgIERJU0NPTk5FQ1RfUkVBU09OX01BUC5nZXQoc2Vzc2lvblN0YXR1cy5kaXNjb25uZWN0UmVhc29uIHx8ICcnKSA/P1xuICAgICAgICAgICAgTWVldERpc2Nvbm5lY3RSZWFzb24uU0VTU0lPTl9VTkhFQUxUSFksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwcml2YXRlIG9uU2Vzc2lvbkNvbnRyb2xDbG9zZWQoKSB7XG4gICAgLy8gSWYgdGhlIGNoYW5uZWwgaXMgY2xvc2VkLCB3ZSBzaG91bGQgcmVzb2x2ZSB0aGUgbGVhdmUgc2Vzc2lvbiBwcm9taXNlLlxuICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgTG9nTGV2ZWwuTUVTU0FHRVMsXG4gICAgICAnU2Vzc2lvbiBjb250cm9sIGNoYW5uZWw6IGNsb3NlZCcsXG4gICAgKTtcbiAgICB0aGlzLmxlYXZlU2Vzc2lvblByb21pc2U/LigpO1xuICAgIGlmIChcbiAgICAgIHRoaXMuc2Vzc2lvblN0YXR1c0RlbGVnYXRlLmdldCgpLmNvbm5lY3Rpb25TdGF0ZSAhPT1cbiAgICAgIE1lZXRDb25uZWN0aW9uU3RhdGUuRElTQ09OTkVDVEVEXG4gICAgKSB7XG4gICAgICB0aGlzLnNlc3Npb25TdGF0dXNEZWxlZ2F0ZS5zZXQoe1xuICAgICAgICBjb25uZWN0aW9uU3RhdGU6IE1lZXRDb25uZWN0aW9uU3RhdGUuRElTQ09OTkVDVEVELFxuICAgICAgICBkaXNjb25uZWN0UmVhc29uOiBNZWV0RGlzY29ubmVjdFJlYXNvbi5VTktOT1dOLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgbGVhdmVTZXNzaW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgTG9nTGV2ZWwuTUVTU0FHRVMsXG4gICAgICAnU2Vzc2lvbiBjb250cm9sIGNoYW5uZWw6IGxlYXZlIHNlc3Npb24gcmVxdWVzdCBzZW50JyxcbiAgICApO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmNoYW5uZWwuc2VuZChcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICAgIHJlcXVlc3RJZDogdGhpcy5yZXF1ZXN0SWQrKyxcbiAgICAgICAgICAgIGxlYXZlOiB7fSxcbiAgICAgICAgICB9IGFzIExlYXZlUmVxdWVzdCxcbiAgICAgICAgfSBhcyBTZXNzaW9uQ29udHJvbENoYW5uZWxGcm9tQ2xpZW50KSxcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5jaGFubmVsTG9nZ2VyPy5sb2coXG4gICAgICAgIExvZ0xldmVsLkVSUk9SUyxcbiAgICAgICAgJ1Nlc3Npb24gY29udHJvbCBjaGFubmVsOiBGYWlsZWQgdG8gc2VuZCBsZWF2ZSByZXF1ZXN0IHdpdGggZXJyb3InLFxuICAgICAgICBlIGFzIEVycm9yLFxuICAgICAgKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5sZWF2ZVNlc3Npb25Qcm9taXNlID0gcmVzb2x2ZTtcbiAgICB9KTtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDI0IEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFZpZGVvIGFzc2lnbm1lbnQgY2hhbm5lbCBoYW5kbGVyLlxuICovXG5cbmltcG9ydCB7XG4gIE1lZGlhQXBpQ2FudmFzLFxuICBNZWRpYUFwaVJlc3BvbnNlU3RhdHVzLFxuICBTZXRWaWRlb0Fzc2lnbm1lbnRSZXF1ZXN0LFxuICBTZXRWaWRlb0Fzc2lnbm1lbnRSZXNwb25zZSxcbiAgVmlkZW9Bc3NpZ25tZW50Q2hhbm5lbEZyb21DbGllbnQsXG4gIFZpZGVvQXNzaWdubWVudENoYW5uZWxUb0NsaWVudCxcbiAgVmlkZW9Bc3NpZ25tZW50UmVzb3VyY2UsXG59IGZyb20gJy4uLy4uL3R5cGVzL2RhdGFjaGFubmVscyc7XG5pbXBvcnQge0xvZ0xldmVsfSBmcm9tICcuLi8uLi90eXBlcy9lbnVtcyc7XG5pbXBvcnQge1xuICBNZWRpYUVudHJ5LFxuICBNZWRpYUxheW91dCxcbiAgTWVkaWFMYXlvdXRSZXF1ZXN0LFxuICBNZWV0U3RyZWFtVHJhY2ssXG59IGZyb20gJy4uLy4uL3R5cGVzL21lZGlhdHlwZXMnO1xuaW1wb3J0IHtcbiAgSW50ZXJuYWxNZWRpYUVudHJ5LFxuICBJbnRlcm5hbE1lZGlhTGF5b3V0LFxuICBJbnRlcm5hbE1lZXRTdHJlYW1UcmFjayxcbn0gZnJvbSAnLi4vaW50ZXJuYWxfdHlwZXMnO1xuaW1wb3J0IHtTdWJzY3JpYmFibGVEZWxlZ2F0ZX0gZnJvbSAnLi4vc3Vic2NyaWJhYmxlX2ltcGwnO1xuaW1wb3J0IHtjcmVhdGVNZWRpYUVudHJ5fSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge0NoYW5uZWxMb2dnZXJ9IGZyb20gJy4vY2hhbm5lbF9sb2dnZXInO1xuXG4vLyBXZSByZXF1ZXN0IHRoZSBoaWdoZXN0IHBvc3NpYmxlIHJlc29sdXRpb24gYnkgZGVmYXVsdC5cbmNvbnN0IE1BWF9SRVNPTFVUSU9OID0ge1xuICBoZWlnaHQ6IDEwODAsXG4gIHdpZHRoOiAxOTIwLFxuICBmcmFtZVJhdGU6IDMwLFxufTtcblxuLyoqXG4gKiBIZWxwZXIgY2xhc3MgdG8gaGFuZGxlIHRoZSB2aWRlbyBhc3NpZ25tZW50IGNoYW5uZWwuXG4gKi9cbmV4cG9ydCBjbGFzcyBWaWRlb0Fzc2lnbm1lbnRDaGFubmVsSGFuZGxlciB7XG4gIHByaXZhdGUgcmVxdWVzdElkID0gMTtcbiAgcHJpdmF0ZSByZWFkb25seSBtZWRpYUxheW91dExhYmVsTWFwID0gbmV3IE1hcDxNZWRpYUxheW91dCwgc3RyaW5nPigpO1xuICBwcml2YXRlIHJlYWRvbmx5IHBlbmRpbmdSZXF1ZXN0UmVzb2x2ZU1hcCA9IG5ldyBNYXA8XG4gICAgbnVtYmVyLFxuICAgICh2YWx1ZTogTWVkaWFBcGlSZXNwb25zZVN0YXR1cykgPT4gdm9pZFxuICA+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBjaGFubmVsOiBSVENEYXRhQ2hhbm5lbCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGlkTWVkaWFFbnRyeU1hcDogTWFwPG51bWJlciwgTWVkaWFFbnRyeT4sXG4gICAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbE1lZGlhRW50cnlNYXAgPSBuZXcgTWFwPFxuICAgICAgTWVkaWFFbnRyeSxcbiAgICAgIEludGVybmFsTWVkaWFFbnRyeVxuICAgID4oKSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGlkTWVkaWFMYXlvdXRNYXAgPSBuZXcgTWFwPG51bWJlciwgTWVkaWFMYXlvdXQ+KCksXG4gICAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbE1lZGlhTGF5b3V0TWFwID0gbmV3IE1hcDxcbiAgICAgIE1lZGlhTGF5b3V0LFxuICAgICAgSW50ZXJuYWxNZWRpYUxheW91dFxuICAgID4oKSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1lZGlhRW50cmllc0RlbGVnYXRlOiBTdWJzY3JpYmFibGVEZWxlZ2F0ZTxNZWRpYUVudHJ5W10+LFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaW50ZXJuYWxNZWV0U3RyZWFtVHJhY2tNYXAgPSBuZXcgTWFwPFxuICAgICAgTWVldFN0cmVhbVRyYWNrLFxuICAgICAgSW50ZXJuYWxNZWV0U3RyZWFtVHJhY2tcbiAgICA+KCksXG4gICAgcHJpdmF0ZSByZWFkb25seSBjaGFubmVsTG9nZ2VyPzogQ2hhbm5lbExvZ2dlcixcbiAgKSB7XG4gICAgdGhpcy5jaGFubmVsLm9ubWVzc2FnZSA9IChldmVudCkgPT4ge1xuICAgICAgdGhpcy5vblZpZGVvQXNzaWdubWVudE1lc3NhZ2UoZXZlbnQpO1xuICAgIH07XG4gICAgdGhpcy5jaGFubmVsLm9uY2xvc2UgPSAoKSA9PiB7XG4gICAgICAvLyBSZXNvbHZlIGFsbCBwZW5kaW5nIHJlcXVlc3RzIHdpdGggYW4gZXJyb3IuXG4gICAgICB0aGlzLmNoYW5uZWxMb2dnZXI/LmxvZyhcbiAgICAgICAgTG9nTGV2ZWwuTUVTU0FHRVMsXG4gICAgICAgICdWaWRlbyBhc3NpZ25tZW50IGNoYW5uZWw6IGNsb3NlZCcsXG4gICAgICApO1xuICAgICAgZm9yIChjb25zdCBbLCByZXNvbHZlXSBvZiB0aGlzLnBlbmRpbmdSZXF1ZXN0UmVzb2x2ZU1hcCkge1xuICAgICAgICByZXNvbHZlKHtjb2RlOiA0MDAsIG1lc3NhZ2U6ICdDaGFubmVsIGNsb3NlZCcsIGRldGFpbHM6IFtdfSk7XG4gICAgICB9XG4gICAgICB0aGlzLnBlbmRpbmdSZXF1ZXN0UmVzb2x2ZU1hcC5jbGVhcigpO1xuICAgIH07XG4gICAgdGhpcy5jaGFubmVsLm9ub3BlbiA9ICgpID0+IHtcbiAgICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgICBMb2dMZXZlbC5NRVNTQUdFUyxcbiAgICAgICAgJ1ZpZGVvIGFzc2lnbm1lbnQgY2hhbm5lbDogb3BlbmVkJyxcbiAgICAgICk7XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgb25WaWRlb0Fzc2lnbm1lbnRNZXNzYWdlKG1lc3NhZ2U6IE1lc3NhZ2VFdmVudCkge1xuICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKG1lc3NhZ2UuZGF0YSkgYXMgVmlkZW9Bc3NpZ25tZW50Q2hhbm5lbFRvQ2xpZW50O1xuICAgIGlmIChkYXRhLnJlc3BvbnNlKSB7XG4gICAgICB0aGlzLm9uVmlkZW9Bc3NpZ25tZW50UmVzcG9uc2UoZGF0YS5yZXNwb25zZSk7XG4gICAgfVxuICAgIGlmIChkYXRhLnJlc291cmNlcykge1xuICAgICAgdGhpcy5vblZpZGVvQXNzaWdubWVudFJlc291cmNlcyhkYXRhLnJlc291cmNlcyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvblZpZGVvQXNzaWdubWVudFJlc3BvbnNlKHJlc3BvbnNlOiBTZXRWaWRlb0Fzc2lnbm1lbnRSZXNwb25zZSkge1xuICAgIC8vIFVzZXJzIHNob3VsZCBsaXN0ZW4gb24gdGhlIHZpZGVvIGFzc2lnbm1lbnQgY2hhbm5lbCBmb3IgYWN0dWFsIHZpZGVvXG4gICAgLy8gYXNzaWdubWVudHMuIFRoZXNlIHJlc3BvbnNlcyBzaWduaWZ5IHRoYXQgdGhlIHJlcXVlc3Qgd2FzIGV4cGVjdGVkLlxuICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgTG9nTGV2ZWwuTUVTU0FHRVMsXG4gICAgICAnVmlkZW8gYXNzaWdubWVudCBjaGFubmVsOiByZWNpZXZlZCByZXNwb25zZScsXG4gICAgICByZXNwb25zZSxcbiAgICApO1xuICAgIHRoaXMucGVuZGluZ1JlcXVlc3RSZXNvbHZlTWFwLmdldChyZXNwb25zZS5yZXF1ZXN0SWQpPy4ocmVzcG9uc2Uuc3RhdHVzKTtcbiAgfVxuXG4gIHByaXZhdGUgb25WaWRlb0Fzc2lnbm1lbnRSZXNvdXJjZXMocmVzb3VyY2VzOiBWaWRlb0Fzc2lnbm1lbnRSZXNvdXJjZVtdKSB7XG4gICAgcmVzb3VyY2VzLmZvckVhY2goKHJlc291cmNlKSA9PiB7XG4gICAgICB0aGlzLmNoYW5uZWxMb2dnZXI/LmxvZyhcbiAgICAgICAgTG9nTGV2ZWwuUkVTT1VSQ0VTLFxuICAgICAgICAnVmlkZW8gYXNzaWdubWVudCBjaGFubmVsOiByZXNvdXJjZSBhZGRlZCcsXG4gICAgICAgIHJlc291cmNlLFxuICAgICAgKTtcbiAgICAgIGlmIChyZXNvdXJjZS52aWRlb0Fzc2lnbm1lbnQuY2FudmFzZXMpIHtcbiAgICAgICAgdGhpcy5vblZpZGVvQXNzaWdubWVudChyZXNvdXJjZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIG9uVmlkZW9Bc3NpZ25tZW50KHZpZGVvQXNzaWdubWVudDogVmlkZW9Bc3NpZ25tZW50UmVzb3VyY2UpIHtcbiAgICBjb25zdCBjYW52YXNlcyA9IHZpZGVvQXNzaWdubWVudC52aWRlb0Fzc2lnbm1lbnQuY2FudmFzZXM7XG4gICAgY2FudmFzZXMuZm9yRWFjaChcbiAgICAgIChjYW52YXM6IHtjYW52YXNJZDogbnVtYmVyOyBzc3JjPzogbnVtYmVyOyBtZWRpYUVudHJ5SWQ6IG51bWJlcn0pID0+IHtcbiAgICAgICAgY29uc3QgbWVkaWFMYXlvdXQgPSB0aGlzLmlkTWVkaWFMYXlvdXRNYXAuZ2V0KGNhbnZhcy5jYW52YXNJZCk7XG4gICAgICAgIC8vIFdlIGV4cGVjdCB0aGF0IHRoZSBtZWRpYSBsYXlvdXQgaXMgYWxyZWFkeSBjcmVhdGVkLlxuICAgICAgICBsZXQgaW50ZXJuYWxNZWRpYUVudHJ5O1xuICAgICAgICBpZiAobWVkaWFMYXlvdXQpIHtcbiAgICAgICAgICBjb25zdCBhc3NpZ25lZE1lZGlhRW50cnkgPSBtZWRpYUxheW91dC5tZWRpYUVudHJ5LmdldCgpO1xuICAgICAgICAgIGxldCBtZWRpYUVudHJ5O1xuICAgICAgICAgIC8vIGlmIGFzc29jaWF0aW9uIGFscmVhZHkgZXhpc3RzLCB3ZSBuZWVkIHRvIGVpdGhlciB1cGRhdGUgdGhlIHZpZGVvXG4gICAgICAgICAgLy8gc3NyYyBvciByZW1vdmUgdGhlIGFzc29jaWF0aW9uIGlmIHRoZSBpZHMgZG9uJ3QgbWF0Y2guXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgYXNzaWduZWRNZWRpYUVudHJ5ICYmXG4gICAgICAgICAgICB0aGlzLmludGVybmFsTWVkaWFFbnRyeU1hcC5nZXQoYXNzaWduZWRNZWRpYUVudHJ5KT8uaWQgPT09XG4gICAgICAgICAgICAgIGNhbnZhcy5tZWRpYUVudHJ5SWRcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIC8vIFdlIGV4cGVjdCB0aGUgaW50ZXJuYWwgbWVkaWEgZW50cnkgdG8gYmUgYWxyZWFkeSBjcmVhdGVkIGlmIHRoZSBtZWRpYSBlbnRyeSBleGlzdHMuXG4gICAgICAgICAgICBpbnRlcm5hbE1lZGlhRW50cnkgPVxuICAgICAgICAgICAgICB0aGlzLmludGVybmFsTWVkaWFFbnRyeU1hcC5nZXQoYXNzaWduZWRNZWRpYUVudHJ5KTtcbiAgICAgICAgICAgIC8vIElmIHRoZSBtZWRpYSBjYW52YXMgaXMgYWxyZWFkeSBhc3NvY2lhdGVkIHdpdGggYSBtZWRpYSBlbnRyeSwgd2VcbiAgICAgICAgICAgIC8vIG5lZWQgdG8gdXBkYXRlIHRoZSB2aWRlbyBzc3JjLlxuICAgICAgICAgICAgLy8gRXhwZWN0IHRoZSBtZWRpYSBlbnRyeSB0byBiZSBjcmVhdGVkLCB3aXRob3V0IGFzc2VydGlvbiwgVFNcbiAgICAgICAgICAgIC8vIGNvbXBsYWlucyBpdCBjYW4gYmUgdW5kZWZpbmVkLlxuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGU6bm8tdW5uZWNlc3NhcnktdHlwZS1hc3NlcnRpb25cbiAgICAgICAgICAgIGludGVybmFsTWVkaWFFbnRyeSEudmlkZW9Tc3JjID0gY2FudmFzLnNzcmM7XG4gICAgICAgICAgICBtZWRpYUVudHJ5ID0gYXNzaWduZWRNZWRpYUVudHJ5O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBJZiBhc3Nzb2NhdGlvbiBkb2VzIG5vdCBleGlzdCwgd2Ugd2lsbCBhdHRlbXB0IHRvIHJldHJlaXZlIHRoZVxuICAgICAgICAgICAgLy8gbWVkaWEgZW50cnkgZnJvbSB0aGUgbWFwLlxuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdNZWRpYUVudHJ5ID0gdGhpcy5pZE1lZGlhRW50cnlNYXAuZ2V0KFxuICAgICAgICAgICAgICBjYW52YXMubWVkaWFFbnRyeUlkLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIC8vIENsZWFyIGV4aXN0aW5nIGFzc29jaWF0aW9uIGlmIGl0IGV4aXN0cy5cbiAgICAgICAgICAgIGlmIChhc3NpZ25lZE1lZGlhRW50cnkpIHtcbiAgICAgICAgICAgICAgdGhpcy5pbnRlcm5hbE1lZGlhRW50cnlNYXBcbiAgICAgICAgICAgICAgICAuZ2V0KGFzc2lnbmVkTWVkaWFFbnRyeSlcbiAgICAgICAgICAgICAgICA/Lm1lZGlhTGF5b3V0LnNldCh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICB0aGlzLmludGVybmFsTWVkaWFMYXlvdXRNYXBcbiAgICAgICAgICAgICAgICAuZ2V0KG1lZGlhTGF5b3V0KVxuICAgICAgICAgICAgICAgID8ubWVkaWFFbnRyeS5zZXQodW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleGlzdGluZ01lZGlhRW50cnkpIHtcbiAgICAgICAgICAgICAgLy8gSWYgdGhlIG1lZGlhIGVudHJ5IGV4aXN0cywgbmVlZCB0byBjcmVhdGUgdGhlIG1lZGlhIGNhbnZhcyBhc3NvY2lhdGlvbi5cbiAgICAgICAgICAgICAgaW50ZXJuYWxNZWRpYUVudHJ5ID1cbiAgICAgICAgICAgICAgICB0aGlzLmludGVybmFsTWVkaWFFbnRyeU1hcC5nZXQoZXhpc3RpbmdNZWRpYUVudHJ5KTtcbiAgICAgICAgICAgICAgaW50ZXJuYWxNZWRpYUVudHJ5IS52aWRlb1NzcmMgPSBjYW52YXMuc3NyYztcbiAgICAgICAgICAgICAgaW50ZXJuYWxNZWRpYUVudHJ5IS5tZWRpYUxheW91dC5zZXQobWVkaWFMYXlvdXQpO1xuICAgICAgICAgICAgICBtZWRpYUVudHJ5ID0gZXhpc3RpbmdNZWRpYUVudHJ5O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gSWYgdGhlIG1lZGlhIGVudHJ5IGRvZXdzbid0IGV4aXN0LCB3ZSBuZWVkIHRvIGNyZWF0ZSBpdCBhbmRcbiAgICAgICAgICAgICAgLy8gdGhlbiBjcmVhdGUgdGhlIG1lZGlhIGNhbnZhcyBhc3NvY2lhdGlvbi5cbiAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgZXhwZWN0IHRvIGhpdCB0aGlzIGV4cHJlc3Npb24sIGJ1dCBzaW5jZSBkYXRhIGNoYW5uZWxzXG4gICAgICAgICAgICAgIC8vIGRvbid0IGd1YXJhbnRlZSBvcmRlciwgd2UgZG8gdGhpcyB0byBiZSBzYWZlLlxuICAgICAgICAgICAgICBjb25zdCBtZWRpYUVudHJ5RWxlbWVudCA9IGNyZWF0ZU1lZGlhRW50cnkoe1xuICAgICAgICAgICAgICAgIGlkOiBjYW52YXMubWVkaWFFbnRyeUlkLFxuICAgICAgICAgICAgICAgIG1lZGlhTGF5b3V0LFxuICAgICAgICAgICAgICAgIHZpZGVvU3NyYzogY2FudmFzLnNzcmMsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB0aGlzLmludGVybmFsTWVkaWFFbnRyeU1hcC5zZXQoXG4gICAgICAgICAgICAgICAgbWVkaWFFbnRyeUVsZW1lbnQubWVkaWFFbnRyeSxcbiAgICAgICAgICAgICAgICBtZWRpYUVudHJ5RWxlbWVudC5pbnRlcm5hbE1lZGlhRW50cnksXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGludGVybmFsTWVkaWFFbnRyeSA9IG1lZGlhRW50cnlFbGVtZW50LmludGVybmFsTWVkaWFFbnRyeTtcbiAgICAgICAgICAgICAgY29uc3QgbmV3TWVkaWFFbnRyeSA9IG1lZGlhRW50cnlFbGVtZW50Lm1lZGlhRW50cnk7XG4gICAgICAgICAgICAgIHRoaXMuaWRNZWRpYUVudHJ5TWFwLnNldChjYW52YXMubWVkaWFFbnRyeUlkLCBuZXdNZWRpYUVudHJ5KTtcbiAgICAgICAgICAgICAgY29uc3QgbmV3TWVkaWFFbnRyaWVzID0gW1xuICAgICAgICAgICAgICAgIC4uLnRoaXMubWVkaWFFbnRyaWVzRGVsZWdhdGUuZ2V0KCksXG4gICAgICAgICAgICAgICAgbmV3TWVkaWFFbnRyeSxcbiAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgdGhpcy5tZWRpYUVudHJpZXNEZWxlZ2F0ZS5zZXQobmV3TWVkaWFFbnRyaWVzKTtcbiAgICAgICAgICAgICAgbWVkaWFFbnRyeSA9IG5ld01lZGlhRW50cnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmludGVybmFsTWVkaWFMYXlvdXRNYXBcbiAgICAgICAgICAgICAgLmdldChtZWRpYUxheW91dClcbiAgICAgICAgICAgICAgPy5tZWRpYUVudHJ5LnNldChtZWRpYUVudHJ5KTtcbiAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxNZWRpYUVudHJ5TWFwXG5cbiAgICAgICAgICAgICAgLmdldChtZWRpYUVudHJ5ISlcbiAgICAgICAgICAgICAgPy5tZWRpYUxheW91dC5zZXQobWVkaWFMYXlvdXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhdGhpcy5pc01lZGlhRW50cnlBc3NpZ25lZFRvTWVldFN0cmVhbVRyYWNrKFxuICAgICAgICAgICAgICBtZWRpYUVudHJ5ISxcbiAgICAgICAgICAgICAgaW50ZXJuYWxNZWRpYUVudHJ5ISxcbiAgICAgICAgICAgIClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuYXNzaWduVmlkZW9NZWV0U3RyZWFtVHJhY2sobWVkaWFFbnRyeSEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB0c2xpbnQ6ZW5hYmxlOm5vLXVubmVjZXNzYXJ5LXR5cGUtYXNzZXJ0aW9uXG4gICAgICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgICAgIExvZ0xldmVsLkVSUk9SUyxcbiAgICAgICAgICAnVmlkZW8gYXNzaWdubWVudCBjaGFubmVsOiBzZXJ2ZXIgc2VudCBhIGNhbnZhcyB0aGF0IHdhcyBub3QgY3JlYXRlZCBieSB0aGUgY2xpZW50JyxcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHNlbmRSZXF1ZXN0cyhcbiAgICBtZWRpYUxheW91dFJlcXVlc3RzOiBNZWRpYUxheW91dFJlcXVlc3RbXSxcbiAgKTogUHJvbWlzZTxNZWRpYUFwaVJlc3BvbnNlU3RhdHVzPiB7XG4gICAgY29uc3QgbGFiZWwgPSBEYXRlLm5vdygpLnRvU3RyaW5nKCk7XG4gICAgY29uc3QgY2FudmFzZXM6IE1lZGlhQXBpQ2FudmFzW10gPSBbXTtcbiAgICBtZWRpYUxheW91dFJlcXVlc3RzLmZvckVhY2goKHJlcXVlc3QpID0+IHtcbiAgICAgIHRoaXMubWVkaWFMYXlvdXRMYWJlbE1hcC5zZXQocmVxdWVzdC5tZWRpYUxheW91dCwgbGFiZWwpO1xuICAgICAgY2FudmFzZXMucHVzaCh7XG4gICAgICAgIGlkOiB0aGlzLmludGVybmFsTWVkaWFMYXlvdXRNYXAuZ2V0KHJlcXVlc3QubWVkaWFMYXlvdXQpIS5pZCxcbiAgICAgICAgZGltZW5zaW9uczogcmVxdWVzdC5tZWRpYUxheW91dC5jYW52YXNEaW1lbnNpb25zLFxuICAgICAgICByZWxldmFudDoge30sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBjb25zdCByZXF1ZXN0OiBTZXRWaWRlb0Fzc2lnbm1lbnRSZXF1ZXN0ID0ge1xuICAgICAgcmVxdWVzdElkOiB0aGlzLnJlcXVlc3RJZCsrLFxuICAgICAgc2V0QXNzaWdubWVudDoge1xuICAgICAgICBsYXlvdXRNb2RlbDoge1xuICAgICAgICAgIGxhYmVsLFxuICAgICAgICAgIGNhbnZhc2VzLFxuICAgICAgICB9LFxuICAgICAgICBtYXhWaWRlb1Jlc29sdXRpb246IE1BWF9SRVNPTFVUSU9OLFxuICAgICAgfSxcbiAgICB9O1xuICAgIHRoaXMuY2hhbm5lbExvZ2dlcj8ubG9nKFxuICAgICAgTG9nTGV2ZWwuTUVTU0FHRVMsXG4gICAgICAnVmlkZW8gQXNzaWdubWVudCBjaGFubmVsOiBTZW5kaW5nIHJlcXVlc3QnLFxuICAgICAgcmVxdWVzdCxcbiAgICApO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmNoYW5uZWwuc2VuZChcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHJlcXVlc3QsXG4gICAgICAgIH0gYXMgVmlkZW9Bc3NpZ25tZW50Q2hhbm5lbEZyb21DbGllbnQpLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLmNoYW5uZWxMb2dnZXI/LmxvZyhcbiAgICAgICAgTG9nTGV2ZWwuRVJST1JTLFxuICAgICAgICAnVmlkZW8gQXNzaWdubWVudCBjaGFubmVsOiBGYWlsZWQgdG8gc2VuZCByZXF1ZXN0IHdpdGggZXJyb3InLFxuICAgICAgICBlIGFzIEVycm9yLFxuICAgICAgKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgY29uc3QgcmVxdWVzdFByb21pc2UgPSBuZXcgUHJvbWlzZTxNZWRpYUFwaVJlc3BvbnNlU3RhdHVzPigocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5wZW5kaW5nUmVxdWVzdFJlc29sdmVNYXAuc2V0KHJlcXVlc3QucmVxdWVzdElkLCByZXNvbHZlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVxdWVzdFByb21pc2U7XG4gIH1cblxuICBwcml2YXRlIGlzTWVkaWFFbnRyeUFzc2lnbmVkVG9NZWV0U3RyZWFtVHJhY2soXG4gICAgbWVkaWFFbnRyeTogTWVkaWFFbnRyeSxcbiAgICBpbnRlcm5hbE1lZGlhRW50cnk6IEludGVybmFsTWVkaWFFbnRyeSxcbiAgKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdmlkZW9NZWV0U3RyZWFtVHJhY2sgPSBtZWRpYUVudHJ5LnZpZGVvTWVldFN0cmVhbVRyYWNrLmdldCgpO1xuICAgIGlmICghdmlkZW9NZWV0U3RyZWFtVHJhY2spIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBpbnRlcm5hbE1lZXRTdHJlYW1UcmFjayA9XG4gICAgICB0aGlzLmludGVybmFsTWVldFN0cmVhbVRyYWNrTWFwLmdldCh2aWRlb01lZXRTdHJlYW1UcmFjayk7XG5cbiAgICBpZiAoaW50ZXJuYWxNZWV0U3RyZWFtVHJhY2shLnZpZGVvU3NyYyA9PT0gaW50ZXJuYWxNZWRpYUVudHJ5LnZpZGVvU3NyYykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNzcmNzIGNhbiBjaGFuZ2UsIGlmIHRoZSB2aWRlbyBzc3JjIGlzIG5vdCB0aGUgc2FtZSwgd2UgbmVlZCB0byByZW1vdmVcbiAgICAgIC8vIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgbWVkaWEgZW50cnkgYW5kIHRoZSBtZWV0IHN0cmVhbSB0cmFjay5cbiAgICAgIGludGVybmFsTWVkaWFFbnRyeS52aWRlb01lZXRTdHJlYW1UcmFjay5zZXQodW5kZWZpbmVkKTtcbiAgICAgIGludGVybmFsTWVldFN0cmVhbVRyYWNrPy5tZWRpYUVudHJ5LnNldCh1bmRlZmluZWQpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXNzaWduVmlkZW9NZWV0U3RyZWFtVHJhY2sobWVkaWFFbnRyeTogTWVkaWFFbnRyeSkge1xuICAgIGZvciAoY29uc3QgW21lZXRTdHJlYW1UcmFjaywgaW50ZXJuYWxNZWV0U3RyZWFtVHJhY2tdIG9mIHRoaXNcbiAgICAgIC5pbnRlcm5hbE1lZXRTdHJlYW1UcmFja01hcCkge1xuICAgICAgaWYgKG1lZXRTdHJlYW1UcmFjay5tZWRpYVN0cmVhbVRyYWNrLmtpbmQgPT09ICd2aWRlbycpIHtcbiAgICAgICAgaW50ZXJuYWxNZWV0U3RyZWFtVHJhY2subWF5YmVBc3NpZ25NZWRpYUVudHJ5T25GcmFtZShcbiAgICAgICAgICBtZWRpYUVudHJ5LFxuICAgICAgICAgICd2aWRlbycsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMjQgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhlIGRlZmF1bHQgY29tbXVuaWNhdGlvbiBwcm90b2NvbCBmb3IgdGhlIE1lZGlhIEFQSSBjbGllbnRcbiAqIHdpdGggTWVldCBBUEkuXG4gKi9cblxuaW1wb3J0IHtNZWV0TWVkaWFDbGllbnRSZXF1aXJlZENvbmZpZ3VyYXRpb259IGZyb20gJy4uLy4uL3R5cGVzL21lZGlhdHlwZXMnO1xuXG5pbXBvcnQge1xuICBNZWRpYUFwaUNvbW11bmljYXRpb25Qcm90b2NvbCxcbiAgTWVkaWFBcGlDb21tdW5pY2F0aW9uUmVzcG9uc2UsXG59IGZyb20gJy4uLy4uL3R5cGVzL2NvbW11bmljYXRpb25fcHJvdG9jb2wnO1xuXG5jb25zdCBNRUVUX0FQSV9VUkwgPSAnaHR0cHM6Ly9tZWV0Lmdvb2dsZWFwaXMuY29tL3YyYmV0YS8nO1xuXG4vKipcbiAqIFRoZSBIVFRQIGNvbW11bmljYXRpb24gcHJvdG9jb2wgZm9yIGNvbW11bmljYXRpb24gd2l0aCBNZWV0IEFQSS5cbiAqL1xuZXhwb3J0IGNsYXNzIERlZmF1bHRDb21tdW5pY2F0aW9uUHJvdG9jb2xJbXBsXG4gIGltcGxlbWVudHMgTWVkaWFBcGlDb21tdW5pY2F0aW9uUHJvdG9jb2xcbntcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXF1aXJlZENvbmZpZ3VyYXRpb246IE1lZXRNZWRpYUNsaWVudFJlcXVpcmVkQ29uZmlndXJhdGlvbixcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1lZXRBcGlVcmw6IHN0cmluZyA9IE1FRVRfQVBJX1VSTCxcbiAgKSB7fVxuXG4gIGFzeW5jIGNvbm5lY3RBY3RpdmVDb25mZXJlbmNlKFxuICAgIHNkcE9mZmVyOiBzdHJpbmcsXG4gICk6IFByb21pc2U8TWVkaWFBcGlDb21tdW5pY2F0aW9uUmVzcG9uc2U+IHtcbiAgICAvLyBDYWxsIHRvIE1lZXQgQVBJXG4gICAgY29uc3QgY29ubmVjdFVybCA9IGAke3RoaXMubWVldEFwaVVybH0ke3RoaXMucmVxdWlyZWRDb25maWd1cmF0aW9uLm1lZXRpbmdTcGFjZUlkfTpjb25uZWN0QWN0aXZlQ29uZmVyZW5jZWA7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChjb25uZWN0VXJsLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7dGhpcy5yZXF1aXJlZENvbmZpZ3VyYXRpb24uYWNjZXNzVG9rZW59YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICdvZmZlcic6IHNkcE9mZmVyLFxuICAgICAgfSksXG4gICAgfSk7XG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgY29uc3QgYm9keVJlYWRlciA9IHJlc3BvbnNlLmJvZHk/LmdldFJlYWRlcigpO1xuICAgICAgbGV0IGVycm9yID0gJyc7XG4gICAgICBpZiAoYm9keVJlYWRlcikge1xuICAgICAgICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG4gICAgICAgIGxldCByZWFkaW5nRG9uZSA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAoIXJlYWRpbmdEb25lKSB7XG4gICAgICAgICAgY29uc3Qge2RvbmUsIHZhbHVlfSA9IGF3YWl0IGJvZHlSZWFkZXI/LnJlYWQoKTtcbiAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgcmVhZGluZ0RvbmUgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVycm9yICs9IGRlY29kZXIuZGVjb2RlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgZXJyb3JKc29uID0gSlNPTi5wYXJzZShlcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7SlNPTi5zdHJpbmdpZnkoZXJyb3JKc29uLCBudWxsLCAyKX1gKTtcbiAgICB9XG4gICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4ge2Fuc3dlcjogcGF5bG9hZFsnYW5zd2VyJ119IGFzIE1lZGlhQXBpQ29tbXVuaWNhdGlvblJlc3BvbnNlO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMjQgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgSW1wbGVtZW50YXRpb24gb2YgSW50ZXJuYWxNZWV0U3RyZWFtVHJhY2suXG4gKi9cblxuaW1wb3J0IHtNZWRpYUVudHJ5LCBNZWV0U3RyZWFtVHJhY2t9IGZyb20gJy4uL3R5cGVzL21lZGlhdHlwZXMnO1xuaW1wb3J0IHtTdWJzY3JpYmFibGVEZWxlZ2F0ZX0gZnJvbSAnLi9zdWJzY3JpYmFibGVfaW1wbCc7XG5cbmltcG9ydCB7SW50ZXJuYWxNZWRpYUVudHJ5LCBJbnRlcm5hbE1lZXRTdHJlYW1UcmFja30gZnJvbSAnLi9pbnRlcm5hbF90eXBlcyc7XG5cbi8qKlxuICogSW1wbGVtZW50YXRpb24gb2YgSW50ZXJuYWxNZWV0U3RyZWFtVHJhY2suXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnRlcm5hbE1lZXRTdHJlYW1UcmFja0ltcGwgaW1wbGVtZW50cyBJbnRlcm5hbE1lZXRTdHJlYW1UcmFjayB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVhZGVyOiBSZWFkYWJsZVN0cmVhbURlZmF1bHRSZWFkZXI7XG4gIHZpZGVvU3NyYz86IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICByZWFkb25seSByZWNlaXZlcjogUlRDUnRwUmVjZWl2ZXIsXG4gICAgcmVhZG9ubHkgbWVkaWFFbnRyeTogU3Vic2NyaWJhYmxlRGVsZWdhdGU8TWVkaWFFbnRyeSB8IHVuZGVmaW5lZD4sXG4gICAgcHJpdmF0ZSByZWFkb25seSBtZWV0U3RyZWFtVHJhY2s6IE1lZXRTdHJlYW1UcmFjayxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGludGVybmFsTWVkaWFFbnRyeU1hcDogTWFwPE1lZGlhRW50cnksIEludGVybmFsTWVkaWFFbnRyeT4sXG4gICkge1xuICAgIGNvbnN0IG1lZGlhU3RyZWFtVHJhY2sgPSBtZWV0U3RyZWFtVHJhY2subWVkaWFTdHJlYW1UcmFjaztcbiAgICBsZXQgbWVkaWFTdHJlYW1UcmFja1Byb2Nlc3NvcjtcbiAgICBpZiAobWVkaWFTdHJlYW1UcmFjay5raW5kID09PSAnYXVkaW8nKSB7XG4gICAgICBtZWRpYVN0cmVhbVRyYWNrUHJvY2Vzc29yID0gbmV3IE1lZGlhU3RyZWFtVHJhY2tQcm9jZXNzb3Ioe1xuICAgICAgICB0cmFjazogbWVkaWFTdHJlYW1UcmFjayBhcyBNZWRpYVN0cmVhbUF1ZGlvVHJhY2ssXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWVkaWFTdHJlYW1UcmFja1Byb2Nlc3NvciA9IG5ldyBNZWRpYVN0cmVhbVRyYWNrUHJvY2Vzc29yKHtcbiAgICAgICAgdHJhY2s6IG1lZGlhU3RyZWFtVHJhY2sgYXMgTWVkaWFTdHJlYW1WaWRlb1RyYWNrLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMucmVhZGVyID0gbWVkaWFTdHJlYW1UcmFja1Byb2Nlc3Nvci5yZWFkYWJsZS5nZXRSZWFkZXIoKTtcbiAgfVxuXG4gIGFzeW5jIG1heWJlQXNzaWduTWVkaWFFbnRyeU9uRnJhbWUoXG4gICAgbWVkaWFFbnRyeTogTWVkaWFFbnRyeSxcbiAgICBraW5kOiAnYXVkaW8nIHwgJ3ZpZGVvJyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gT25seSB3YW50IHRvIGNoZWNrIHRoZSBtZWRpYSBlbnRyeSBpZiBpdCBoYXMgdGhlIGNvcnJlY3QgY3NyYyB0eXBlXG4gICAgLy8gZm9yIHRoaXMgbWVldCBzdHJlYW0gdHJhY2suXG4gICAgaWYgKFxuICAgICAgIXRoaXMubWVkaWFTdHJlYW1UcmFja1NyY1ByZXNlbnQobWVkaWFFbnRyeSkgfHxcbiAgICAgIHRoaXMubWVldFN0cmVhbVRyYWNrLm1lZGlhU3RyZWFtVHJhY2sua2luZCAhPT0ga2luZFxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBMb29wIHRocm91Z2ggdGhlIGZyYW1lcyB1bnRpbCBtZWRpYSBlbnRyeSBpcyBhc3NpZ25lZCBieSBlaXRoZXIgdGhpc1xuICAgIC8vIG1lZXQgc3RyZWFtIHRyYWNrIG9yIGFub3RoZXIgbWVldCBzdHJlYW0gdHJhY2suXG4gICAgd2hpbGUgKCF0aGlzLm1lZGlhRW50cnlUcmFja0Fzc2lnbmVkKG1lZGlhRW50cnksIGtpbmQpKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IGF3YWl0IHRoaXMucmVhZGVyLnJlYWQoKTtcbiAgICAgIGlmIChmcmFtZS5kb25lKSBicmVhaztcbiAgICAgIGlmIChraW5kID09PSAnYXVkaW8nKSB7XG4gICAgICAgIGF3YWl0IHRoaXMub25BdWRpb0ZyYW1lKG1lZGlhRW50cnkpO1xuICAgICAgfSBlbHNlIGlmIChraW5kID09PSAndmlkZW8nKSB7XG4gICAgICAgIHRoaXMub25WaWRlb0ZyYW1lKG1lZGlhRW50cnkpO1xuICAgICAgfVxuICAgICAgZnJhbWUudmFsdWUuY2xvc2UoKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvbkF1ZGlvRnJhbWUobWVkaWFFbnRyeTogTWVkaWFFbnRyeSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGludGVybmFsTWVkaWFFbnRyeSA9IHRoaXMuaW50ZXJuYWxNZWRpYUVudHJ5TWFwLmdldChtZWRpYUVudHJ5KTtcbiAgICBjb25zdCBjb250cmlidXRpbmdTb3VyY2VzOiBSVENSdHBDb250cmlidXRpbmdTb3VyY2VbXSA9XG4gICAgICB0aGlzLnJlY2VpdmVyLmdldENvbnRyaWJ1dGluZ1NvdXJjZXMoKTtcbiAgICBmb3IgKGNvbnN0IGNvbnRyaWJ1dGluZ1NvdXJjZSBvZiBjb250cmlidXRpbmdTb3VyY2VzKSB7XG4gICAgICBpZiAoY29udHJpYnV0aW5nU291cmNlLnNvdXJjZSA9PT0gaW50ZXJuYWxNZWRpYUVudHJ5IS5hdWRpb0NzcmMpIHtcbiAgICAgICAgaW50ZXJuYWxNZWRpYUVudHJ5IS5hdWRpb01lZXRTdHJlYW1UcmFjay5zZXQodGhpcy5tZWV0U3RyZWFtVHJhY2spO1xuICAgICAgICB0aGlzLm1lZGlhRW50cnkuc2V0KG1lZGlhRW50cnkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25WaWRlb0ZyYW1lKG1lZGlhRW50cnk6IE1lZGlhRW50cnkpOiB2b2lkIHtcbiAgICBjb25zdCBpbnRlcm5hbE1lZGlhRW50cnkgPSB0aGlzLmludGVybmFsTWVkaWFFbnRyeU1hcC5nZXQobWVkaWFFbnRyeSk7XG4gICAgY29uc3Qgc3luY2hyb25pemF0aW9uU291cmNlczogUlRDUnRwU3luY2hyb25pemF0aW9uU291cmNlW10gPVxuICAgICAgdGhpcy5yZWNlaXZlci5nZXRTeW5jaHJvbml6YXRpb25Tb3VyY2VzKCk7XG4gICAgZm9yIChjb25zdCBzeW5jU291cmNlIG9mIHN5bmNocm9uaXphdGlvblNvdXJjZXMpIHtcbiAgICAgIGlmIChzeW5jU291cmNlLnNvdXJjZSA9PT0gaW50ZXJuYWxNZWRpYUVudHJ5IS52aWRlb1NzcmMpIHtcbiAgICAgICAgdGhpcy52aWRlb1NzcmMgPSBzeW5jU291cmNlLnNvdXJjZTtcbiAgICAgICAgaW50ZXJuYWxNZWRpYUVudHJ5IS52aWRlb01lZXRTdHJlYW1UcmFjay5zZXQodGhpcy5tZWV0U3RyZWFtVHJhY2spO1xuICAgICAgICB0aGlzLm1lZGlhRW50cnkuc2V0KG1lZGlhRW50cnkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm47XG4gIH1cblxuICBwcml2YXRlIG1lZGlhRW50cnlUcmFja0Fzc2lnbmVkKFxuICAgIG1lZGlhRW50cnk6IE1lZGlhRW50cnksXG4gICAga2luZDogJ2F1ZGlvJyB8ICd2aWRlbycsXG4gICk6IGJvb2xlYW4ge1xuICAgIGlmIChcbiAgICAgIChraW5kID09PSAnYXVkaW8nICYmIG1lZGlhRW50cnkuYXVkaW9NZWV0U3RyZWFtVHJhY2suZ2V0KCkpIHx8XG4gICAgICAoa2luZCA9PT0gJ3ZpZGVvJyAmJiBtZWRpYUVudHJ5LnZpZGVvTWVldFN0cmVhbVRyYWNrLmdldCgpKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgbWVkaWFTdHJlYW1UcmFja1NyY1ByZXNlbnQobWVkaWFFbnRyeTogTWVkaWFFbnRyeSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGludGVybmFsTWVkaWFFbnRyeSA9IHRoaXMuaW50ZXJuYWxNZWRpYUVudHJ5TWFwLmdldChtZWRpYUVudHJ5KTtcbiAgICBpZiAodGhpcy5tZWV0U3RyZWFtVHJhY2subWVkaWFTdHJlYW1UcmFjay5raW5kID09PSAnYXVkaW8nKSB7XG4gICAgICByZXR1cm4gISFpbnRlcm5hbE1lZGlhRW50cnk/LmF1ZGlvQ3NyYztcbiAgICB9IGVsc2UgaWYgKHRoaXMubWVldFN0cmVhbVRyYWNrLm1lZGlhU3RyZWFtVHJhY2sua2luZCA9PT0gJ3ZpZGVvJykge1xuICAgICAgcmV0dXJuICEhaW50ZXJuYWxNZWRpYUVudHJ5Py52aWRlb1NzcmM7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDI0IEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEltcGxlbWVudGF0aW9uIG9mIE1lZXRTdHJlYW1UcmFjay5cbiAqL1xuXG5pbXBvcnQge01lZGlhRW50cnksIE1lZXRTdHJlYW1UcmFja30gZnJvbSAnLi4vdHlwZXMvbWVkaWF0eXBlcyc7XG5pbXBvcnQge1N1YnNjcmliYWJsZX0gZnJvbSAnLi4vdHlwZXMvc3Vic2NyaWJhYmxlJztcblxuaW1wb3J0IHtTdWJzY3JpYmFibGVEZWxlZ2F0ZX0gZnJvbSAnLi9zdWJzY3JpYmFibGVfaW1wbCc7XG5cbi8qKlxuICogVGhlIGltcGxlbWVudGF0aW9uIG9mIE1lZXRTdHJlYW1UcmFjay5cbiAqL1xuZXhwb3J0IGNsYXNzIE1lZXRTdHJlYW1UcmFja0ltcGwgaW1wbGVtZW50cyBNZWV0U3RyZWFtVHJhY2sge1xuICByZWFkb25seSBtZWRpYUVudHJ5OiBTdWJzY3JpYmFibGU8TWVkaWFFbnRyeSB8IHVuZGVmaW5lZD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcmVhZG9ubHkgbWVkaWFTdHJlYW1UcmFjazogTWVkaWFTdHJlYW1UcmFjayxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1lZGlhRW50cnlEZWxlZ2F0ZTogU3Vic2NyaWJhYmxlRGVsZWdhdGU8XG4gICAgICBNZWRpYUVudHJ5IHwgdW5kZWZpbmVkXG4gICAgPixcbiAgKSB7XG4gICAgdGhpcy5tZWRpYUVudHJ5ID0gdGhpcy5tZWRpYUVudHJ5RGVsZWdhdGUuZ2V0U3Vic2NyaWJhYmxlKCk7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAyNCBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7XG4gIE1lZGlhQXBpQ29tbXVuaWNhdGlvblByb3RvY29sLFxuICBNZWRpYUFwaUNvbW11bmljYXRpb25SZXNwb25zZSxcbn0gZnJvbSAnLi4vdHlwZXMvY29tbXVuaWNhdGlvbl9wcm90b2NvbCc7XG5pbXBvcnQge01lZGlhQXBpUmVzcG9uc2VTdGF0dXN9IGZyb20gJy4uL3R5cGVzL2RhdGFjaGFubmVscyc7XG5pbXBvcnQge01lZXRDb25uZWN0aW9uU3RhdGV9IGZyb20gJy4uL3R5cGVzL2VudW1zJztcbmltcG9ydCB7XG4gIENhbnZhc0RpbWVuc2lvbnMsXG4gIE1lZGlhRW50cnksXG4gIE1lZGlhTGF5b3V0LFxuICBNZWRpYUxheW91dFJlcXVlc3QsXG4gIE1lZXRNZWRpYUNsaWVudFJlcXVpcmVkQ29uZmlndXJhdGlvbixcbiAgTWVldFN0cmVhbVRyYWNrLFxuICBQYXJ0aWNpcGFudCxcbn0gZnJvbSAnLi4vdHlwZXMvbWVkaWF0eXBlcyc7XG5pbXBvcnQge1xuICBNZWV0TWVkaWFBcGlDbGllbnQsXG4gIE1lZXRTZXNzaW9uU3RhdHVzLFxufSBmcm9tICcuLi90eXBlcy9tZWV0bWVkaWFhcGljbGllbnQnO1xuaW1wb3J0IHtTdWJzY3JpYmFibGV9IGZyb20gJy4uL3R5cGVzL3N1YnNjcmliYWJsZSc7XG5pbXBvcnQge0NoYW5uZWxMb2dnZXJ9IGZyb20gJy4vY2hhbm5lbF9oYW5kbGVycy9jaGFubmVsX2xvZ2dlcic7XG5pbXBvcnQge01lZGlhRW50cmllc0NoYW5uZWxIYW5kbGVyfSBmcm9tICcuL2NoYW5uZWxfaGFuZGxlcnMvbWVkaWFfZW50cmllc19jaGFubmVsX2hhbmRsZXInO1xuaW1wb3J0IHtNZWRpYVN0YXRzQ2hhbm5lbEhhbmRsZXJ9IGZyb20gJy4vY2hhbm5lbF9oYW5kbGVycy9tZWRpYV9zdGF0c19jaGFubmVsX2hhbmRsZXInO1xuaW1wb3J0IHtQYXJ0aWNpcGFudHNDaGFubmVsSGFuZGxlcn0gZnJvbSAnLi9jaGFubmVsX2hhbmRsZXJzL3BhcnRpY2lwYW50c19jaGFubmVsX2hhbmRsZXInO1xuaW1wb3J0IHtTZXNzaW9uQ29udHJvbENoYW5uZWxIYW5kbGVyfSBmcm9tICcuL2NoYW5uZWxfaGFuZGxlcnMvc2Vzc2lvbl9jb250cm9sX2NoYW5uZWxfaGFuZGxlcic7XG5pbXBvcnQge1ZpZGVvQXNzaWdubWVudENoYW5uZWxIYW5kbGVyfSBmcm9tICcuL2NoYW5uZWxfaGFuZGxlcnMvdmlkZW9fYXNzaWdubWVudF9jaGFubmVsX2hhbmRsZXInO1xuaW1wb3J0IHtEZWZhdWx0Q29tbXVuaWNhdGlvblByb3RvY29sSW1wbH0gZnJvbSAnLi9jb21tdW5pY2F0aW9uX3Byb3RvY29scy9kZWZhdWx0X2NvbW11bmljYXRpb25fcHJvdG9jb2xfaW1wbCc7XG5pbXBvcnQge0ludGVybmFsTWVldFN0cmVhbVRyYWNrSW1wbH0gZnJvbSAnLi9pbnRlcm5hbF9tZWV0X3N0cmVhbV90cmFja19pbXBsJztcbmltcG9ydCB7XG4gIEludGVybmFsTWVkaWFFbnRyeSxcbiAgSW50ZXJuYWxNZWRpYUxheW91dCxcbiAgSW50ZXJuYWxNZWV0U3RyZWFtVHJhY2ssXG4gIEludGVybmFsUGFydGljaXBhbnQsXG59IGZyb20gJy4vaW50ZXJuYWxfdHlwZXMnO1xuaW1wb3J0IHtNZWV0U3RyZWFtVHJhY2tJbXBsfSBmcm9tICcuL21lZXRfc3RyZWFtX3RyYWNrX2ltcGwnO1xuaW1wb3J0IHtTdWJzY3JpYmFibGVEZWxlZ2F0ZSwgU3Vic2NyaWJhYmxlSW1wbH0gZnJvbSAnLi9zdWJzY3JpYmFibGVfaW1wbCc7XG5cbi8vIE1lZXQgb25seSBzdXBwb3J0cyAzIGF1ZGlvIHZpcnR1YWwgc3NyY3MuIElmIGRpc2FibGVkLCB0aGVyZSB3aWxsIGJlIG5vXG4vLyBhdWRpby5cbmNvbnN0IE5VTUJFUl9PRl9BVURJT19WSVJUVUFMX1NTUkMgPSAzO1xuXG5jb25zdCBNSU5JTVVNX1ZJREVPX1NUUkVBTVMgPSAwO1xuY29uc3QgTUFYSU1VTV9WSURFT19TVFJFQU1TID0gMztcblxuLyoqXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiBNZWV0TWVkaWFBcGlDbGllbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZWV0TWVkaWFBcGlDbGllbnRJbXBsIGltcGxlbWVudHMgTWVldE1lZGlhQXBpQ2xpZW50IHtcbiAgLy8gUHVibGljIHByb3BlcnRpZXNcbiAgcmVhZG9ubHkgc2Vzc2lvblN0YXR1czogU3Vic2NyaWJhYmxlPE1lZXRTZXNzaW9uU3RhdHVzPjtcbiAgcmVhZG9ubHkgbWVldFN0cmVhbVRyYWNrczogU3Vic2NyaWJhYmxlPE1lZXRTdHJlYW1UcmFja1tdPjtcbiAgcmVhZG9ubHkgbWVkaWFFbnRyaWVzOiBTdWJzY3JpYmFibGU8TWVkaWFFbnRyeVtdPjtcbiAgcmVhZG9ubHkgcGFydGljaXBhbnRzOiBTdWJzY3JpYmFibGU8UGFydGljaXBhbnRbXT47XG4gIHJlYWRvbmx5IHByZXNlbnRlcjogU3Vic2NyaWJhYmxlPE1lZGlhRW50cnkgfCB1bmRlZmluZWQ+O1xuICByZWFkb25seSBzY3JlZW5zaGFyZTogU3Vic2NyaWJhYmxlPE1lZGlhRW50cnkgfCB1bmRlZmluZWQ+O1xuXG4gIC8vIFByaXZhdGUgcHJvcGVydGllc1xuICBwcml2YXRlIHJlYWRvbmx5IHNlc3Npb25TdGF0dXNEZWxlZ2F0ZTogU3Vic2NyaWJhYmxlRGVsZWdhdGU8TWVldFNlc3Npb25TdGF0dXM+O1xuICBwcml2YXRlIHJlYWRvbmx5IG1lZXRTdHJlYW1UcmFja3NEZWxlZ2F0ZTogU3Vic2NyaWJhYmxlRGVsZWdhdGU8XG4gICAgTWVldFN0cmVhbVRyYWNrW11cbiAgPjtcbiAgcHJpdmF0ZSByZWFkb25seSBtZWRpYUVudHJpZXNEZWxlZ2F0ZTogU3Vic2NyaWJhYmxlRGVsZWdhdGU8TWVkaWFFbnRyeVtdPjtcbiAgcHJpdmF0ZSByZWFkb25seSBwYXJ0aWNpcGFudHNEZWxlZ2F0ZTogU3Vic2NyaWJhYmxlRGVsZWdhdGU8UGFydGljaXBhbnRbXT47XG4gIHByaXZhdGUgcmVhZG9ubHkgcHJlc2VudGVyRGVsZWdhdGU6IFN1YnNjcmliYWJsZURlbGVnYXRlPFxuICAgIE1lZGlhRW50cnkgfCB1bmRlZmluZWRcbiAgPjtcbiAgcHJpdmF0ZSByZWFkb25seSBzY3JlZW5zaGFyZURlbGVnYXRlOiBTdWJzY3JpYmFibGVEZWxlZ2F0ZTxcbiAgICBNZWRpYUVudHJ5IHwgdW5kZWZpbmVkXG4gID47XG5cbiAgcHJpdmF0ZSByZWFkb25seSBwZWVyQ29ubmVjdGlvbjogUlRDUGVlckNvbm5lY3Rpb247XG5cbiAgcHJpdmF0ZSBzZXNzaW9uQ29udHJvbENoYW5uZWw6IFJUQ0RhdGFDaGFubmVsIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIHNlc3Npb25Db250cm9sQ2hhbm5lbEhhbmRsZXI6XG4gICAgfCBTZXNzaW9uQ29udHJvbENoYW5uZWxIYW5kbGVyXG4gICAgfCB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSB2aWRlb0Fzc2lnbm1lbnRDaGFubmVsOiBSVENEYXRhQ2hhbm5lbCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSB2aWRlb0Fzc2lnbm1lbnRDaGFubmVsSGFuZGxlcjpcbiAgICB8IFZpZGVvQXNzaWdubWVudENoYW5uZWxIYW5kbGVyXG4gICAgfCB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSBtZWRpYUVudHJpZXNDaGFubmVsOiBSVENEYXRhQ2hhbm5lbCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBtZWRpYVN0YXRzQ2hhbm5lbDogUlRDRGF0YUNoYW5uZWwgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgcGFydGljaXBhbnRzQ2hhbm5lbDogUlRDRGF0YUNoYW5uZWwgfCB1bmRlZmluZWQ7XG5cbiAgLyogdHNsaW50OmRpc2FibGU6bm8tdW51c2VkLXZhcmlhYmxlICovXG4gIC8vIFRoaXMgaXMgdW51c2VkIGJlY2F1c2UgaXQgaXMgcmVjZWl2ZSBvbmx5LlxuICAvLyBAdHMtaWdub3JlXG4gIHByaXZhdGUgbWVkaWFFbnRyaWVzQ2hhbm5lbEhhbmRsZXI6IE1lZGlhRW50cmllc0NoYW5uZWxIYW5kbGVyIHwgdW5kZWZpbmVkO1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgcHJpdmF0ZSBtZWRpYVN0YXRzQ2hhbm5lbEhhbmRsZXI6IE1lZGlhU3RhdHNDaGFubmVsSGFuZGxlciB8IHVuZGVmaW5lZDtcblxuICAvLyBAdHMtaWdub3JlXG4gIHByaXZhdGUgcGFydGljaXBhbnRzQ2hhbm5lbEhhbmRsZXI6IFBhcnRpY2lwYW50c0NoYW5uZWxIYW5kbGVyIHwgdW5kZWZpbmVkO1xuICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXVudXNlZC12YXJpYWJsZSAqL1xuXG4gIHByaXZhdGUgbWVkaWFMYXlvdXRJZCA9IDE7XG5cbiAgLy8gTWVkaWEgbGF5b3V0IHJldHJpZXZhbCBieSBpZC4gTmVlZGVkIGJ5IHRoZSB2aWRlbyBhc3NpZ25tZW50IGNoYW5uZWwgaGFuZGxlclxuICAvLyB0byB1cGRhdGUgdGhlIG1lZGlhIGxheW91dC5cbiAgcHJpdmF0ZSByZWFkb25seSBpZE1lZGlhTGF5b3V0TWFwID0gbmV3IE1hcDxudW1iZXIsIE1lZGlhTGF5b3V0PigpO1xuXG4gIC8vIFVzZWQgdG8gdXBkYXRlIG1lZGlhIGxheW91dHMuXG4gIHByaXZhdGUgcmVhZG9ubHkgaW50ZXJuYWxNZWRpYUxheW91dE1hcCA9IG5ldyBNYXA8XG4gICAgTWVkaWFMYXlvdXQsXG4gICAgSW50ZXJuYWxNZWRpYUxheW91dFxuICA+KCk7XG5cbiAgLy8gTWVkaWEgZW50cnkgcmV0cmlldmFsIGJ5IGlkLiBOZWVkZWQgYnkgdGhlIHZpZGVvIGFzc2lnbm1lbnQgY2hhbm5lbCBoYW5kbGVyXG4gIC8vIHRvIHVwZGF0ZSB0aGUgbWVkaWEgZW50cnkuXG4gIHByaXZhdGUgcmVhZG9ubHkgaWRNZWRpYUVudHJ5TWFwID0gbmV3IE1hcDxudW1iZXIsIE1lZGlhRW50cnk+KCk7XG5cbiAgLy8gVXNlZCB0byB1cGRhdGUgbWVkaWEgZW50cmllcy5cbiAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbE1lZGlhRW50cnlNYXAgPSBuZXcgTWFwPFxuICAgIE1lZGlhRW50cnksXG4gICAgSW50ZXJuYWxNZWRpYUVudHJ5XG4gID4oKTtcblxuICAvLyBVc2VkIHRvIHVwZGF0ZSBtZWV0IHN0cmVhbSB0cmFja3MuXG4gIHByaXZhdGUgcmVhZG9ubHkgaW50ZXJuYWxNZWV0U3RyZWFtVHJhY2tNYXAgPSBuZXcgTWFwPFxuICAgIE1lZXRTdHJlYW1UcmFjayxcbiAgICBJbnRlcm5hbE1lZXRTdHJlYW1UcmFja1xuICA+KCk7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBpZFBhcnRpY2lwYW50TWFwID0gbmV3IE1hcDxudW1iZXIsIFBhcnRpY2lwYW50PigpO1xuICBwcml2YXRlIHJlYWRvbmx5IG5hbWVQYXJ0aWNpcGFudE1hcCA9IG5ldyBNYXA8c3RyaW5nLCBQYXJ0aWNpcGFudD4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbFBhcnRpY2lwYW50TWFwID0gbmV3IE1hcDxcbiAgICBQYXJ0aWNpcGFudCxcbiAgICBJbnRlcm5hbFBhcnRpY2lwYW50XG4gID4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJlcXVpcmVkQ29uZmlndXJhdGlvbjogTWVldE1lZGlhQ2xpZW50UmVxdWlyZWRDb25maWd1cmF0aW9uLFxuICApIHtcbiAgICB0aGlzLnZhbGlkYXRlQ29uZmlndXJhdGlvbigpO1xuXG4gICAgdGhpcy5zZXNzaW9uU3RhdHVzRGVsZWdhdGUgPSBuZXcgU3Vic2NyaWJhYmxlRGVsZWdhdGU8TWVldFNlc3Npb25TdGF0dXM+KHtcbiAgICAgIGNvbm5lY3Rpb25TdGF0ZTogTWVldENvbm5lY3Rpb25TdGF0ZS5VTktOT1dOLFxuICAgIH0pO1xuICAgIHRoaXMuc2Vzc2lvblN0YXR1cyA9IHRoaXMuc2Vzc2lvblN0YXR1c0RlbGVnYXRlLmdldFN1YnNjcmliYWJsZSgpO1xuICAgIHRoaXMubWVldFN0cmVhbVRyYWNrc0RlbGVnYXRlID0gbmV3IFN1YnNjcmliYWJsZURlbGVnYXRlPE1lZXRTdHJlYW1UcmFja1tdPihcbiAgICAgIFtdLFxuICAgICk7XG4gICAgdGhpcy5tZWV0U3RyZWFtVHJhY2tzID0gdGhpcy5tZWV0U3RyZWFtVHJhY2tzRGVsZWdhdGUuZ2V0U3Vic2NyaWJhYmxlKCk7XG4gICAgdGhpcy5tZWRpYUVudHJpZXNEZWxlZ2F0ZSA9IG5ldyBTdWJzY3JpYmFibGVEZWxlZ2F0ZTxNZWRpYUVudHJ5W10+KFtdKTtcbiAgICB0aGlzLm1lZGlhRW50cmllcyA9IHRoaXMubWVkaWFFbnRyaWVzRGVsZWdhdGUuZ2V0U3Vic2NyaWJhYmxlKCk7XG4gICAgdGhpcy5wYXJ0aWNpcGFudHNEZWxlZ2F0ZSA9IG5ldyBTdWJzY3JpYmFibGVEZWxlZ2F0ZTxQYXJ0aWNpcGFudFtdPihbXSk7XG4gICAgdGhpcy5wYXJ0aWNpcGFudHMgPSB0aGlzLnBhcnRpY2lwYW50c0RlbGVnYXRlLmdldFN1YnNjcmliYWJsZSgpO1xuICAgIHRoaXMucHJlc2VudGVyRGVsZWdhdGUgPSBuZXcgU3Vic2NyaWJhYmxlRGVsZWdhdGU8TWVkaWFFbnRyeSB8IHVuZGVmaW5lZD4oXG4gICAgICB1bmRlZmluZWQsXG4gICAgKTtcbiAgICB0aGlzLnByZXNlbnRlciA9IHRoaXMucHJlc2VudGVyRGVsZWdhdGUuZ2V0U3Vic2NyaWJhYmxlKCk7XG4gICAgdGhpcy5zY3JlZW5zaGFyZURlbGVnYXRlID0gbmV3IFN1YnNjcmliYWJsZURlbGVnYXRlPE1lZGlhRW50cnkgfCB1bmRlZmluZWQ+KFxuICAgICAgdW5kZWZpbmVkLFxuICAgICk7XG4gICAgdGhpcy5zY3JlZW5zaGFyZSA9IHRoaXMuc2NyZWVuc2hhcmVEZWxlZ2F0ZS5nZXRTdWJzY3JpYmFibGUoKTtcblxuICAgIGNvbnN0IGNvbmZpZ3VyYXRpb24gPSB7XG4gICAgICBzZHBTZW1hbnRpY3M6ICd1bmlmaWVkLXBsYW4nLFxuICAgICAgYnVuZGxlUG9saWN5OiAnbWF4LWJ1bmRsZScgYXMgUlRDQnVuZGxlUG9saWN5LFxuICAgICAgaWNlU2VydmVyczogW3t1cmxzOiAnc3R1bjpzdHVuLmwuZ29vZ2xlLmNvbToxOTMwMid9XSxcbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRlIHBlZXIgY29ubmVjdGlvblxuICAgIHRoaXMucGVlckNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oY29uZmlndXJhdGlvbik7XG4gICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5vbnRyYWNrID0gKGUpID0+IHtcbiAgICAgIGlmIChlLnRyYWNrKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlTWVldFN0cmVhbVRyYWNrKGUudHJhY2ssIGUucmVjZWl2ZXIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHZhbGlkYXRlQ29uZmlndXJhdGlvbigpOiB2b2lkIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnJlcXVpcmVkQ29uZmlndXJhdGlvbi5udW1iZXJPZlZpZGVvU3RyZWFtcyA8IE1JTklNVU1fVklERU9fU1RSRUFNUyB8fFxuICAgICAgdGhpcy5yZXF1aXJlZENvbmZpZ3VyYXRpb24ubnVtYmVyT2ZWaWRlb1N0cmVhbXMgPiBNQVhJTVVNX1ZJREVPX1NUUkVBTVNcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFVuc3VwcG9ydGVkIG51bWJlciBvZiB2aWRlbyBzdHJlYW1zLCBtdXN0IGJlIGJldHdlZW4gJHtNSU5JTVVNX1ZJREVPX1NUUkVBTVN9IGFuZCAke01BWElNVU1fVklERU9fU1RSRUFNU31gLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZU1lZXRTdHJlYW1UcmFjayhcbiAgICBtZWRpYVN0cmVhbVRyYWNrOiBNZWRpYVN0cmVhbVRyYWNrLFxuICAgIHJlY2VpdmVyOiBSVENSdHBSZWNlaXZlcixcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgbWVldFN0cmVhbVRyYWNrcyA9IHRoaXMubWVldFN0cmVhbVRyYWNrcy5nZXQoKTtcbiAgICBjb25zdCBtZWRpYUVudHJ5RGVsZWdhdGUgPSBuZXcgU3Vic2NyaWJhYmxlRGVsZWdhdGU8TWVkaWFFbnRyeSB8IHVuZGVmaW5lZD4oXG4gICAgICB1bmRlZmluZWQsXG4gICAgKTtcbiAgICBjb25zdCBtZWV0U3RyZWFtVHJhY2sgPSBuZXcgTWVldFN0cmVhbVRyYWNrSW1wbChcbiAgICAgIG1lZGlhU3RyZWFtVHJhY2ssXG4gICAgICBtZWRpYUVudHJ5RGVsZWdhdGUsXG4gICAgKTtcblxuICAgIGNvbnN0IGludGVybmFsTWVldFN0cmVhbVRyYWNrID0gbmV3IEludGVybmFsTWVldFN0cmVhbVRyYWNrSW1wbChcbiAgICAgIHJlY2VpdmVyLFxuICAgICAgbWVkaWFFbnRyeURlbGVnYXRlLFxuICAgICAgbWVldFN0cmVhbVRyYWNrLFxuICAgICAgdGhpcy5pbnRlcm5hbE1lZGlhRW50cnlNYXAsXG4gICAgKTtcblxuICAgIGNvbnN0IG5ld1N0cmVhbVRyYWNrQXJyYXkgPSBbLi4ubWVldFN0cmVhbVRyYWNrcywgbWVldFN0cmVhbVRyYWNrXTtcbiAgICB0aGlzLmludGVybmFsTWVldFN0cmVhbVRyYWNrTWFwLnNldChcbiAgICAgIG1lZXRTdHJlYW1UcmFjayxcbiAgICAgIGludGVybmFsTWVldFN0cmVhbVRyYWNrLFxuICAgICk7XG4gICAgdGhpcy5tZWV0U3RyZWFtVHJhY2tzRGVsZWdhdGUuc2V0KG5ld1N0cmVhbVRyYWNrQXJyYXkpO1xuICB9XG5cbiAgYXN5bmMgam9pbk1lZXRpbmcoXG4gICAgY29tbXVuaWNhdGlvblByb3RvY29sPzogTWVkaWFBcGlDb21tdW5pY2F0aW9uUHJvdG9jb2wsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIFRoZSBvZmZlciBtdXN0IGJlIGluIHRoZSBvcmRlciBvZiBhdWRpbywgZGF0YWNoYW5uZWxzLCB2aWRlby5cblxuICAgIC8vIENyZWF0ZSBhdWRpbyB0cmFuc2NlaXZlcnMgYmFzZWQgb24gaW5pdGlhbCBjb25maWcuXG4gICAgaWYgKHRoaXMucmVxdWlyZWRDb25maWd1cmF0aW9uLmVuYWJsZUF1ZGlvU3RyZWFtcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBOVU1CRVJfT0ZfQVVESU9fVklSVFVBTF9TU1JDOyBpKyspIHtcbiAgICAgICAgLy8gSW50ZWdyYXRpbmcgY2xpZW50cyBtdXN0IHN1cHBvcnQgYW5kIG5lZ290aWF0ZSB0aGUgT1BVUyBjb2RlYyBpblxuICAgICAgICAvLyB0aGUgU0RQIG9mZmVyLlxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBkZWZhdWx0IGZvciBXZWJSVEMuXG4gICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL01lZGlhL0Zvcm1hdHMvV2ViUlRDX2NvZGVjcy5cbiAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5hZGRUcmFuc2NlaXZlcignYXVkaW8nLCB7ZGlyZWN0aW9uOiAncmVjdm9ubHknfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tLSBVVElMSVRZIERBVEEgQ0hBTk5FTFMgLS0tLS1cblxuICAgIC8vIEFsbCBkYXRhIGNoYW5uZWxzIG11c3QgYmUgcmVsaWFibGUgYW5kIG9yZGVyZWQuXG4gICAgY29uc3QgZGF0YUNoYW5uZWxDb25maWcgPSB7XG4gICAgICBvcmRlcmVkOiB0cnVlLFxuICAgICAgcmVsaWFibGU6IHRydWUsXG4gICAgfTtcblxuICAgIC8vIEFsd2F5cyBjcmVhdGUgdGhlIHNlc3Npb24gYW5kIG1lZGlhIHN0YXRzIGNvbnRyb2wgY2hhbm5lbC5cbiAgICB0aGlzLnNlc3Npb25Db250cm9sQ2hhbm5lbCA9IHRoaXMucGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXG4gICAgICAnc2Vzc2lvbi1jb250cm9sJyxcbiAgICAgIGRhdGFDaGFubmVsQ29uZmlnLFxuICAgICk7XG4gICAgbGV0IHNlc3Npb25Db250cm9sY2hhbm5lbExvZ2dlcjtcbiAgICBpZiAodGhpcy5yZXF1aXJlZENvbmZpZ3VyYXRpb24/LmxvZ3NDYWxsYmFjaykge1xuICAgICAgc2Vzc2lvbkNvbnRyb2xjaGFubmVsTG9nZ2VyID0gbmV3IENoYW5uZWxMb2dnZXIoXG4gICAgICAgICdzZXNzaW9uLWNvbnRyb2wnLFxuICAgICAgICB0aGlzLnJlcXVpcmVkQ29uZmlndXJhdGlvbi5sb2dzQ2FsbGJhY2ssXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLnNlc3Npb25Db250cm9sQ2hhbm5lbEhhbmRsZXIgPSBuZXcgU2Vzc2lvbkNvbnRyb2xDaGFubmVsSGFuZGxlcihcbiAgICAgIHRoaXMuc2Vzc2lvbkNvbnRyb2xDaGFubmVsLFxuICAgICAgdGhpcy5zZXNzaW9uU3RhdHVzRGVsZWdhdGUsXG4gICAgICBzZXNzaW9uQ29udHJvbGNoYW5uZWxMb2dnZXIsXG4gICAgKTtcblxuICAgIHRoaXMubWVkaWFTdGF0c0NoYW5uZWwgPSB0aGlzLnBlZXJDb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsKFxuICAgICAgJ21lZGlhLXN0YXRzJyxcbiAgICAgIGRhdGFDaGFubmVsQ29uZmlnLFxuICAgICk7XG4gICAgbGV0IG1lZGlhU3RhdHNDaGFubmVsTG9nZ2VyO1xuICAgIGlmICh0aGlzLnJlcXVpcmVkQ29uZmlndXJhdGlvbj8ubG9nc0NhbGxiYWNrKSB7XG4gICAgICBtZWRpYVN0YXRzQ2hhbm5lbExvZ2dlciA9IG5ldyBDaGFubmVsTG9nZ2VyKFxuICAgICAgICAnbWVkaWEtc3RhdHMnLFxuICAgICAgICB0aGlzLnJlcXVpcmVkQ29uZmlndXJhdGlvbi5sb2dzQ2FsbGJhY2ssXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLm1lZGlhU3RhdHNDaGFubmVsSGFuZGxlciA9IG5ldyBNZWRpYVN0YXRzQ2hhbm5lbEhhbmRsZXIoXG4gICAgICB0aGlzLm1lZGlhU3RhdHNDaGFubmVsLFxuICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbixcbiAgICAgIG1lZGlhU3RhdHNDaGFubmVsTG9nZ2VyLFxuICAgICk7XG5cbiAgICAvLyAtLS0tIENPTkRJVElPTkFMIERBVEEgQ0hBTk5FTFMgLS0tLS1cblxuICAgIC8vIFdlIG9ubHkgbmVlZCB0aGUgdmlkZW8gYXNzaWdubWVudCBjaGFubmVsIGlmIHdlIGFyZSByZXF1ZXN0aW5nIHZpZGVvLlxuICAgIGlmICh0aGlzLnJlcXVpcmVkQ29uZmlndXJhdGlvbi5udW1iZXJPZlZpZGVvU3RyZWFtcyA+IDApIHtcbiAgICAgIHRoaXMudmlkZW9Bc3NpZ25tZW50Q2hhbm5lbCA9IHRoaXMucGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXG4gICAgICAgICd2aWRlby1hc3NpZ25tZW50JyxcbiAgICAgICAgZGF0YUNoYW5uZWxDb25maWcsXG4gICAgICApO1xuICAgICAgbGV0IHZpZGVvQXNzaWdubWVudENoYW5uZWxMb2dnZXI7XG4gICAgICBpZiAodGhpcy5yZXF1aXJlZENvbmZpZ3VyYXRpb24/LmxvZ3NDYWxsYmFjaykge1xuICAgICAgICB2aWRlb0Fzc2lnbm1lbnRDaGFubmVsTG9nZ2VyID0gbmV3IENoYW5uZWxMb2dnZXIoXG4gICAgICAgICAgJ3ZpZGVvLWFzc2lnbm1lbnQnLFxuICAgICAgICAgIHRoaXMucmVxdWlyZWRDb25maWd1cmF0aW9uLmxvZ3NDYWxsYmFjayxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudmlkZW9Bc3NpZ25tZW50Q2hhbm5lbEhhbmRsZXIgPSBuZXcgVmlkZW9Bc3NpZ25tZW50Q2hhbm5lbEhhbmRsZXIoXG4gICAgICAgIHRoaXMudmlkZW9Bc3NpZ25tZW50Q2hhbm5lbCxcbiAgICAgICAgdGhpcy5pZE1lZGlhRW50cnlNYXAsXG4gICAgICAgIHRoaXMuaW50ZXJuYWxNZWRpYUVudHJ5TWFwLFxuICAgICAgICB0aGlzLmlkTWVkaWFMYXlvdXRNYXAsXG4gICAgICAgIHRoaXMuaW50ZXJuYWxNZWRpYUxheW91dE1hcCxcbiAgICAgICAgdGhpcy5tZWRpYUVudHJpZXNEZWxlZ2F0ZSxcbiAgICAgICAgdGhpcy5pbnRlcm5hbE1lZXRTdHJlYW1UcmFja01hcCxcbiAgICAgICAgdmlkZW9Bc3NpZ25tZW50Q2hhbm5lbExvZ2dlcixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5yZXF1aXJlZENvbmZpZ3VyYXRpb24ubnVtYmVyT2ZWaWRlb1N0cmVhbXMgPiAwIHx8XG4gICAgICB0aGlzLnJlcXVpcmVkQ29uZmlndXJhdGlvbi5lbmFibGVBdWRpb1N0cmVhbXNcbiAgICApIHtcbiAgICAgIHRoaXMubWVkaWFFbnRyaWVzQ2hhbm5lbCA9IHRoaXMucGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXG4gICAgICAgICdtZWRpYS1lbnRyaWVzJyxcbiAgICAgICAgZGF0YUNoYW5uZWxDb25maWcsXG4gICAgICApO1xuICAgICAgbGV0IG1lZGlhRW50cmllc0NoYW5uZWxMb2dnZXI7XG4gICAgICBpZiAodGhpcy5yZXF1aXJlZENvbmZpZ3VyYXRpb24/LmxvZ3NDYWxsYmFjaykge1xuICAgICAgICBtZWRpYUVudHJpZXNDaGFubmVsTG9nZ2VyID0gbmV3IENoYW5uZWxMb2dnZXIoXG4gICAgICAgICAgJ21lZGlhLWVudHJpZXMnLFxuICAgICAgICAgIHRoaXMucmVxdWlyZWRDb25maWd1cmF0aW9uLmxvZ3NDYWxsYmFjayxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWVkaWFFbnRyaWVzQ2hhbm5lbEhhbmRsZXIgPSBuZXcgTWVkaWFFbnRyaWVzQ2hhbm5lbEhhbmRsZXIoXG4gICAgICAgIHRoaXMubWVkaWFFbnRyaWVzQ2hhbm5lbCxcbiAgICAgICAgdGhpcy5tZWRpYUVudHJpZXNEZWxlZ2F0ZSxcbiAgICAgICAgdGhpcy5pZE1lZGlhRW50cnlNYXAsXG4gICAgICAgIHRoaXMuaW50ZXJuYWxNZWRpYUVudHJ5TWFwLFxuICAgICAgICB0aGlzLmludGVybmFsTWVldFN0cmVhbVRyYWNrTWFwLFxuICAgICAgICB0aGlzLmludGVybmFsTWVkaWFMYXlvdXRNYXAsXG4gICAgICAgIHRoaXMucGFydGljaXBhbnRzRGVsZWdhdGUsXG4gICAgICAgIHRoaXMubmFtZVBhcnRpY2lwYW50TWFwLFxuICAgICAgICB0aGlzLmlkUGFydGljaXBhbnRNYXAsXG4gICAgICAgIHRoaXMuaW50ZXJuYWxQYXJ0aWNpcGFudE1hcCxcbiAgICAgICAgdGhpcy5wcmVzZW50ZXJEZWxlZ2F0ZSxcbiAgICAgICAgdGhpcy5zY3JlZW5zaGFyZURlbGVnYXRlLFxuICAgICAgICBtZWRpYUVudHJpZXNDaGFubmVsTG9nZ2VyLFxuICAgICAgKTtcblxuICAgICAgdGhpcy5wYXJ0aWNpcGFudHNDaGFubmVsID1cbiAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5jcmVhdGVEYXRhQ2hhbm5lbCgncGFydGljaXBhbnRzJyk7XG4gICAgICBsZXQgcGFydGljaXBhbnRzQ2hhbm5lbExvZ2dlcjtcbiAgICAgIGlmICh0aGlzLnJlcXVpcmVkQ29uZmlndXJhdGlvbj8ubG9nc0NhbGxiYWNrKSB7XG4gICAgICAgIHBhcnRpY2lwYW50c0NoYW5uZWxMb2dnZXIgPSBuZXcgQ2hhbm5lbExvZ2dlcihcbiAgICAgICAgICAncGFydGljaXBhbnRzJyxcbiAgICAgICAgICB0aGlzLnJlcXVpcmVkQ29uZmlndXJhdGlvbi5sb2dzQ2FsbGJhY2ssXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucGFydGljaXBhbnRzQ2hhbm5lbEhhbmRsZXIgPSBuZXcgUGFydGljaXBhbnRzQ2hhbm5lbEhhbmRsZXIoXG4gICAgICAgIHRoaXMucGFydGljaXBhbnRzQ2hhbm5lbCxcbiAgICAgICAgdGhpcy5wYXJ0aWNpcGFudHNEZWxlZ2F0ZSxcbiAgICAgICAgdGhpcy5pZFBhcnRpY2lwYW50TWFwLFxuICAgICAgICB0aGlzLm5hbWVQYXJ0aWNpcGFudE1hcCxcbiAgICAgICAgdGhpcy5pbnRlcm5hbFBhcnRpY2lwYW50TWFwLFxuICAgICAgICB0aGlzLmludGVybmFsTWVkaWFFbnRyeU1hcCxcbiAgICAgICAgcGFydGljaXBhbnRzQ2hhbm5lbExvZ2dlcixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXNzaW9uU3RhdHVzRGVsZWdhdGUuc3Vic2NyaWJlKChzdGF0dXMpID0+IHtcbiAgICAgIGlmIChzdGF0dXMuY29ubmVjdGlvblN0YXRlID09PSBNZWV0Q29ubmVjdGlvblN0YXRlLkRJU0NPTk5FQ1RFRCkge1xuICAgICAgICB0aGlzLm1lZGlhU3RhdHNDaGFubmVsPy5jbG9zZSgpO1xuICAgICAgICB0aGlzLnZpZGVvQXNzaWdubWVudENoYW5uZWw/LmNsb3NlKCk7XG4gICAgICAgIHRoaXMubWVkaWFFbnRyaWVzQ2hhbm5lbD8uY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIExvY2FsIGRlc2NyaXB0aW9uIGhhcyB0byBiZSBzZXQgYmVmb3JlIGFkZGluZyB2aWRlbyB0cmFuc2NlaXZlcnMgdG9cbiAgICAvLyBwcmVzZXJ2ZSB0aGUgb3JkZXIgb2YgYXVkaW8sIGRhdGFjaGFubmVscywgdmlkZW8uXG4gICAgbGV0IHBjT2ZmZXIgPSBhd2FpdCB0aGlzLnBlZXJDb25uZWN0aW9uLmNyZWF0ZU9mZmVyKCk7XG4gICAgYXdhaXQgdGhpcy5wZWVyQ29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKHBjT2ZmZXIpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnJlcXVpcmVkQ29uZmlndXJhdGlvbi5udW1iZXJPZlZpZGVvU3RyZWFtczsgaSsrKSB7XG4gICAgICAvLyBJbnRlZ3JhdGluZyBjbGllbnRzIG11c3Qgc3VwcG9ydCBhbmQgbmVnb3RpYXRlIEFWMSwgVlA5LCBhbmQgVlA4IGNvZGVjc1xuICAgICAgLy8gaW4gdGhlIFNEUCBvZmZlci5cbiAgICAgIC8vIFRoZSBkZWZhdWx0IGZvciBXZWJSVEMgaXMgVlA4LlxuICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvTWVkaWEvRm9ybWF0cy9XZWJSVENfY29kZWNzLlxuICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5hZGRUcmFuc2NlaXZlcigndmlkZW8nLCB7ZGlyZWN0aW9uOiAncmVjdm9ubHknfSk7XG4gICAgfVxuXG4gICAgcGNPZmZlciA9IGF3YWl0IHRoaXMucGVlckNvbm5lY3Rpb24uY3JlYXRlT2ZmZXIoKTtcbiAgICBhd2FpdCB0aGlzLnBlZXJDb25uZWN0aW9uLnNldExvY2FsRGVzY3JpcHRpb24ocGNPZmZlcik7XG4gICAgY29uc3QgcHJvdG9jb2w6IE1lZGlhQXBpQ29tbXVuaWNhdGlvblByb3RvY29sID1cbiAgICAgIGNvbW11bmljYXRpb25Qcm90b2NvbCA/P1xuICAgICAgbmV3IERlZmF1bHRDb21tdW5pY2F0aW9uUHJvdG9jb2xJbXBsKHRoaXMucmVxdWlyZWRDb25maWd1cmF0aW9uKTtcbiAgICBjb25zdCByZXNwb25zZTogTWVkaWFBcGlDb21tdW5pY2F0aW9uUmVzcG9uc2UgPVxuICAgICAgYXdhaXQgcHJvdG9jb2wuY29ubmVjdEFjdGl2ZUNvbmZlcmVuY2UocGNPZmZlci5zZHAgPz8gJycpO1xuICAgIGlmIChyZXNwb25zZT8uYW5zd2VyKSB7XG4gICAgICBhd2FpdCB0aGlzLnBlZXJDb25uZWN0aW9uLnNldFJlbW90ZURlc2NyaXB0aW9uKHtcbiAgICAgICAgdHlwZTogJ2Fuc3dlcicsXG4gICAgICAgIHNkcDogcmVzcG9uc2U/LmFuc3dlcixcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXZSBkbyBub3QgZXhwZWN0IHRoaXMgdG8gaGFwcGVuIGFuZCB0aGVyZWZvcmUgaXQgaXMgYW4gaW50ZXJuYWxcbiAgICAgIC8vIGVycm9yLlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnRlcm5hbCBlcnJvciwgbm8gYW5zd2VyIGluIHJlc3BvbnNlJyk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGxlYXZlTWVldGluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5zZXNzaW9uQ29udHJvbENoYW5uZWxIYW5kbGVyKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXNzaW9uQ29udHJvbENoYW5uZWxIYW5kbGVyPy5sZWF2ZVNlc3Npb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbXVzdCBjb25uZWN0IHRvIGEgbWVldGluZyBiZWZvcmUgbGVhdmluZyBpdCcpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoZSBwcm9taXNlIHJlc29sdmluZyBvbiB0aGUgcmVxdWVzdCBkb2VzIG5vdCBtZWFuIHRoZSBsYXlvdXQgaGFzIGJlZW5cbiAgLy8gYXBwbGllZC4gSXQgbWVhbnMgdGhhdCB0aGUgcmVxdWVzdCBoYXMgYmVlbiBhY2NlcHRlZCBhbmQgeW91IG1heSBuZWVkIHRvXG4gIC8vIHdhaXQgYSBzaG9ydCBhbW91bnQgb2YgdGltZSBmb3IgdGhlc2UgbGF5b3V0cyB0byBiZSBhcHBsaWVkLlxuICBhcHBseUxheW91dChyZXF1ZXN0czogTWVkaWFMYXlvdXRSZXF1ZXN0W10pOiBQcm9taXNlPE1lZGlhQXBpUmVzcG9uc2VTdGF0dXM+IHtcbiAgICBpZiAoIXRoaXMudmlkZW9Bc3NpZ25tZW50Q2hhbm5lbEhhbmRsZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ1lvdSBtdXN0IGNvbm5lY3QgdG8gYSBtZWV0aW5nIHdpdGggdmlkZW8gYmVmb3JlIGFwcGx5aW5nIGEgbGF5b3V0JyxcbiAgICAgICk7XG4gICAgfVxuICAgIHJlcXVlc3RzLmZvckVhY2goKHJlcXVlc3QpID0+IHtcbiAgICAgIGlmICghcmVxdWVzdC5tZWRpYUxheW91dCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSByZXF1ZXN0IG11c3QgaW5jbHVkZSBhIG1lZGlhIGxheW91dCcpO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmludGVybmFsTWVkaWFMYXlvdXRNYXAuaGFzKHJlcXVlc3QubWVkaWFMYXlvdXQpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnVGhlIG1lZGlhIGxheW91dCBtdXN0IGJlIGNyZWF0ZWQgdXNpbmcgdGhlIGNsaWVudCBiZWZvcmUgaXQgY2FuIGJlIGFwcGxpZWQnLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzLnZpZGVvQXNzaWdubWVudENoYW5uZWxIYW5kbGVyLnNlbmRSZXF1ZXN0cyhyZXF1ZXN0cyk7XG4gIH1cblxuICBjcmVhdGVNZWRpYUxheW91dChjYW52YXNEaW1lbnNpb25zOiBDYW52YXNEaW1lbnNpb25zKTogTWVkaWFMYXlvdXQge1xuICAgIGNvbnN0IG1lZGlhRW50cnlEZWxlZ2F0ZSA9IG5ldyBTdWJzY3JpYmFibGVEZWxlZ2F0ZTxNZWRpYUVudHJ5IHwgdW5kZWZpbmVkPihcbiAgICAgIHVuZGVmaW5lZCxcbiAgICApO1xuICAgIGNvbnN0IG1lZGlhRW50cnkgPSBuZXcgU3Vic2NyaWJhYmxlSW1wbDxNZWRpYUVudHJ5IHwgdW5kZWZpbmVkPihcbiAgICAgIG1lZGlhRW50cnlEZWxlZ2F0ZSxcbiAgICApO1xuICAgIGNvbnN0IG1lZGlhTGF5b3V0OiBNZWRpYUxheW91dCA9IHtjYW52YXNEaW1lbnNpb25zLCBtZWRpYUVudHJ5fTtcbiAgICB0aGlzLmludGVybmFsTWVkaWFMYXlvdXRNYXAuc2V0KG1lZGlhTGF5b3V0LCB7XG4gICAgICBpZDogdGhpcy5tZWRpYUxheW91dElkLFxuICAgICAgbWVkaWFFbnRyeTogbWVkaWFFbnRyeURlbGVnYXRlLFxuICAgIH0pO1xuICAgIHRoaXMuaWRNZWRpYUxheW91dE1hcC5zZXQodGhpcy5tZWRpYUxheW91dElkLCBtZWRpYUxheW91dCk7XG4gICAgdGhpcy5tZWRpYUxheW91dElkKys7XG4gICAgcmV0dXJuIG1lZGlhTGF5b3V0O1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMjQgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgSW1wbGVtZW50YXRpb24gb2YgdGhlIFN1YnNjcmliYWJsZSBpbnRlcmZhY2UuXG4gKi9cblxuaW1wb3J0IHtTdWJzY3JpYmFibGV9IGZyb20gJy4uL3R5cGVzL3N1YnNjcmliYWJsZSc7XG5cbi8qKlxuICogSW1wbGVtZW50YXRpb24gb2YgdGhlIFN1YnNjcmliYWJsZSBpbnRlcmZhY2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBTdWJzY3JpYmFibGVJbXBsPFQ+IGltcGxlbWVudHMgU3Vic2NyaWJhYmxlPFQ+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBzdWJzY3JpYmFibGVEZWxlZ2F0ZTogU3Vic2NyaWJhYmxlRGVsZWdhdGU8VD4pIHt9XG5cbiAgZ2V0KCk6IFQge1xuICAgIHJldHVybiB0aGlzLnN1YnNjcmliYWJsZURlbGVnYXRlLmdldCgpO1xuICB9XG5cbiAgc3Vic2NyaWJlKGNhbGxiYWNrOiAodmFsdWU6IFQpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgICB0aGlzLnN1YnNjcmliYWJsZURlbGVnYXRlLnN1YnNjcmliZShjYWxsYmFjayk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHRoaXMuc3Vic2NyaWJhYmxlRGVsZWdhdGUudW5zdWJzY3JpYmUoY2FsbGJhY2spO1xuICAgIH07XG4gIH1cblxuICB1bnN1YnNjcmliZShjYWxsYmFjazogKHZhbHVlOiBUKSA9PiB2b2lkKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJhYmxlRGVsZWdhdGUudW5zdWJzY3JpYmUoY2FsbGJhY2spO1xuICB9XG59XG5cbi8qKlxuICogSGVscGVyIGNsYXNzIHRvIHVwZGF0ZSBhIHN1YnNjcmliYWJsZSB2YWx1ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFN1YnNjcmliYWJsZURlbGVnYXRlPFQ+IHtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJzY3JpYmVycyA9IG5ldyBTZXQ8KHZhbHVlOiBUKSA9PiB2b2lkPigpO1xuICBwcml2YXRlIHJlYWRvbmx5IHN1YnNjcmliYWJsZTogU3Vic2NyaWJhYmxlPFQ+ID0gbmV3IFN1YnNjcmliYWJsZUltcGw8VD4oXG4gICAgdGhpcyxcbiAgKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZhbHVlOiBUKSB7fVxuXG4gIHNldChuZXdWYWx1ZTogVCkge1xuICAgIGlmICh0aGlzLnZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgICAgdGhpcy52YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiB0aGlzLnN1YnNjcmliZXJzKSB7XG4gICAgICAgIGNhbGxiYWNrKG5ld1ZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXQoKTogVCB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gIH1cblxuICBzdWJzY3JpYmUoY2FsbGJhY2s6ICh2YWx1ZTogVCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuc3Vic2NyaWJlcnMuYWRkKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHVuc3Vic2NyaWJlKGNhbGxiYWNrOiAodmFsdWU6IFQpID0+IHZvaWQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVycy5kZWxldGUoY2FsbGJhY2spO1xuICB9XG5cbiAgZ2V0U3Vic2NyaWJhYmxlKCk6IFN1YnNjcmliYWJsZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJhYmxlO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMjQgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBmdW5jdGlvbnMgZm9yIHRoZSBNZWV0TWVkaWFBcGlDbGllbnQuXG4gKi9cblxuaW1wb3J0IHtcbiAgTWVkaWFFbnRyeSxcbiAgTWVkaWFMYXlvdXQsXG4gIE1lZXRTdHJlYW1UcmFjayxcbiAgUGFydGljaXBhbnQsXG59IGZyb20gJy4uL3R5cGVzL21lZGlhdHlwZXMnO1xuXG5pbXBvcnQge0ludGVybmFsTWVkaWFFbnRyeX0gZnJvbSAnLi9pbnRlcm5hbF90eXBlcyc7XG5pbXBvcnQge1N1YnNjcmliYWJsZURlbGVnYXRlfSBmcm9tICcuL3N1YnNjcmliYWJsZV9pbXBsJztcblxuaW50ZXJmYWNlIEludGVybmFsTWVkaWFFbnRyeUVsZW1lbnQge1xuICBtZWRpYUVudHJ5OiBNZWRpYUVudHJ5O1xuICBpbnRlcm5hbE1lZGlhRW50cnk6IEludGVybmFsTWVkaWFFbnRyeTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IG1lZGlhIGVudHJ5LlxuICogQHJldHVybiBUaGUgbmV3IG1lZGlhIGVudHJ5IGFuZCBpdHMgaW50ZXJuYWwgcmVwcmVzZW50YXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNZWRpYUVudHJ5KHtcbiAgYXVkaW9NdXRlZCA9IGZhbHNlLFxuICB2aWRlb011dGVkID0gZmFsc2UsXG4gIHNjcmVlblNoYXJlID0gZmFsc2UsXG4gIGlzUHJlc2VudGVyID0gZmFsc2UsXG4gIHBhcnRpY2lwYW50LFxuICBtZWRpYUxheW91dCxcbiAgdmlkZW9NZWV0U3RyZWFtVHJhY2ssXG4gIGF1ZGlvTWVldFN0cmVhbVRyYWNrLFxuICBhdWRpb0NzcmMsXG4gIHZpZGVvQ3NyYyxcbiAgdmlkZW9Tc3JjLFxuICBpZCxcbiAgc2Vzc2lvbiA9ICcnLFxuICBzZXNzaW9uTmFtZSA9ICcnLFxufToge1xuICBpZDogbnVtYmVyO1xuICBhdWRpb011dGVkPzogYm9vbGVhbjtcbiAgdmlkZW9NdXRlZD86IGJvb2xlYW47XG4gIHNjcmVlblNoYXJlPzogYm9vbGVhbjtcbiAgaXNQcmVzZW50ZXI/OiBib29sZWFuO1xuICBwYXJ0aWNpcGFudD86IFBhcnRpY2lwYW50O1xuICBtZWRpYUxheW91dD86IE1lZGlhTGF5b3V0O1xuICBhdWRpb01lZXRTdHJlYW1UcmFjaz86IE1lZXRTdHJlYW1UcmFjaztcbiAgdmlkZW9NZWV0U3RyZWFtVHJhY2s/OiBNZWV0U3RyZWFtVHJhY2s7XG4gIHZpZGVvQ3NyYz86IG51bWJlcjtcbiAgYXVkaW9Dc3JjPzogbnVtYmVyO1xuICB2aWRlb1NzcmM/OiBudW1iZXI7XG4gIHNlc3Npb24/OiBzdHJpbmc7XG4gIHNlc3Npb25OYW1lPzogc3RyaW5nO1xufSk6IEludGVybmFsTWVkaWFFbnRyeUVsZW1lbnQge1xuICBjb25zdCBwYXJ0aWNpcGFudERlbGVnYXRlID0gbmV3IFN1YnNjcmliYWJsZURlbGVnYXRlPFBhcnRpY2lwYW50IHwgdW5kZWZpbmVkPihcbiAgICBwYXJ0aWNpcGFudCxcbiAgKTtcbiAgY29uc3QgYXVkaW9NdXRlZERlbGVnYXRlID0gbmV3IFN1YnNjcmliYWJsZURlbGVnYXRlPGJvb2xlYW4+KGF1ZGlvTXV0ZWQpO1xuICBjb25zdCB2aWRlb011dGVkRGVsZWdhdGUgPSBuZXcgU3Vic2NyaWJhYmxlRGVsZWdhdGU8Ym9vbGVhbj4odmlkZW9NdXRlZCk7XG4gIGNvbnN0IHNjcmVlblNoYXJlRGVsZWdhdGUgPSBuZXcgU3Vic2NyaWJhYmxlRGVsZWdhdGU8Ym9vbGVhbj4oc2NyZWVuU2hhcmUpO1xuICBjb25zdCBpc1ByZXNlbnRlckRlbGVnYXRlID0gbmV3IFN1YnNjcmliYWJsZURlbGVnYXRlPGJvb2xlYW4+KGlzUHJlc2VudGVyKTtcbiAgY29uc3QgbWVkaWFMYXlvdXREZWxlZ2F0ZSA9IG5ldyBTdWJzY3JpYmFibGVEZWxlZ2F0ZTxNZWRpYUxheW91dCB8IHVuZGVmaW5lZD4oXG4gICAgbWVkaWFMYXlvdXQsXG4gICk7XG4gIGNvbnN0IGF1ZGlvTWVldFN0cmVhbVRyYWNrRGVsZWdhdGUgPSBuZXcgU3Vic2NyaWJhYmxlRGVsZWdhdGU8XG4gICAgTWVldFN0cmVhbVRyYWNrIHwgdW5kZWZpbmVkXG4gID4oYXVkaW9NZWV0U3RyZWFtVHJhY2spO1xuICBjb25zdCB2aWRlb01lZXRTdHJlYW1UcmFja0RlbGVnYXRlID0gbmV3IFN1YnNjcmliYWJsZURlbGVnYXRlPFxuICAgIE1lZXRTdHJlYW1UcmFjayB8IHVuZGVmaW5lZFxuICA+KHZpZGVvTWVldFN0cmVhbVRyYWNrKTtcblxuICBjb25zdCBtZWRpYUVudHJ5OiBNZWRpYUVudHJ5ID0ge1xuICAgIHBhcnRpY2lwYW50OiBwYXJ0aWNpcGFudERlbGVnYXRlLmdldFN1YnNjcmliYWJsZSgpLFxuICAgIGF1ZGlvTXV0ZWQ6IGF1ZGlvTXV0ZWREZWxlZ2F0ZS5nZXRTdWJzY3JpYmFibGUoKSxcbiAgICB2aWRlb011dGVkOiB2aWRlb011dGVkRGVsZWdhdGUuZ2V0U3Vic2NyaWJhYmxlKCksXG4gICAgc2NyZWVuU2hhcmU6IHNjcmVlblNoYXJlRGVsZWdhdGUuZ2V0U3Vic2NyaWJhYmxlKCksXG4gICAgaXNQcmVzZW50ZXI6IGlzUHJlc2VudGVyRGVsZWdhdGUuZ2V0U3Vic2NyaWJhYmxlKCksXG4gICAgbWVkaWFMYXlvdXQ6IG1lZGlhTGF5b3V0RGVsZWdhdGUuZ2V0U3Vic2NyaWJhYmxlKCksXG4gICAgYXVkaW9NZWV0U3RyZWFtVHJhY2s6IGF1ZGlvTWVldFN0cmVhbVRyYWNrRGVsZWdhdGUuZ2V0U3Vic2NyaWJhYmxlKCksXG4gICAgdmlkZW9NZWV0U3RyZWFtVHJhY2s6IHZpZGVvTWVldFN0cmVhbVRyYWNrRGVsZWdhdGUuZ2V0U3Vic2NyaWJhYmxlKCksXG4gICAgc2Vzc2lvbk5hbWUsXG4gICAgc2Vzc2lvbixcbiAgfTtcbiAgY29uc3QgaW50ZXJuYWxNZWRpYUVudHJ5OiBJbnRlcm5hbE1lZGlhRW50cnkgPSB7XG4gICAgaWQsXG4gICAgYXVkaW9NdXRlZDogYXVkaW9NdXRlZERlbGVnYXRlLFxuICAgIHZpZGVvTXV0ZWQ6IHZpZGVvTXV0ZWREZWxlZ2F0ZSxcbiAgICBzY3JlZW5TaGFyZTogc2NyZWVuU2hhcmVEZWxlZ2F0ZSxcbiAgICBpc1ByZXNlbnRlcjogaXNQcmVzZW50ZXJEZWxlZ2F0ZSxcbiAgICBtZWRpYUxheW91dDogbWVkaWFMYXlvdXREZWxlZ2F0ZSxcbiAgICBhdWRpb01lZXRTdHJlYW1UcmFjazogYXVkaW9NZWV0U3RyZWFtVHJhY2tEZWxlZ2F0ZSxcbiAgICB2aWRlb01lZXRTdHJlYW1UcmFjazogdmlkZW9NZWV0U3RyZWFtVHJhY2tEZWxlZ2F0ZSxcbiAgICBwYXJ0aWNpcGFudDogcGFydGljaXBhbnREZWxlZ2F0ZSxcbiAgICB2aWRlb1NzcmMsXG4gICAgYXVkaW9Dc3JjLFxuICAgIHZpZGVvQ3NyYyxcbiAgfTtcbiAgcmV0dXJuIHttZWRpYUVudHJ5LCBpbnRlcm5hbE1lZGlhRW50cnl9O1xufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDI0IEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEVudW1zIGZvciB0aGUgTWVkaWEgQVBJIFdlYiBDbGllbnQuIFNpbmNlIG90aGVyIGZpbGVzIGFyZVxuICogdXNpbmcgdGhlIC5kLnRzIGZpbGUsIHdlIG5lZWQgdG8ga2VlcCB0aGUgZW51bXMgaW4gdGhpcyBmaWxlLlxuICovXG5cbi8qKlxuICogTG9nIGxldmVsIGZvciBlYWNoIGRhdGEgY2hhbm5lbC5cbiAqL1xuZXhwb3J0IGVudW0gTG9nTGV2ZWwge1xuICBVTktOT1dOID0gMCxcbiAgRVJST1JTID0gMSxcbiAgUkVTT1VSQ0VTID0gMixcbiAgTUVTU0FHRVMgPSAzLFxufVxuXG4vKiogQ29ubmVjdGlvbiBzdGF0ZSBvZiB0aGUgTWVldCBNZWRpYSBBUEkgc2Vzc2lvbi4gKi9cbmV4cG9ydCBlbnVtIE1lZXRDb25uZWN0aW9uU3RhdGUge1xuICBVTktOT1dOID0gMCxcbiAgV0FJVElORyA9IDEsXG4gIEpPSU5FRCA9IDIsXG4gIERJU0NPTk5FQ1RFRCA9IDMsXG59XG5cbi8qKiBSZWFzb25zIGZvciB0aGUgTWVldCBNZWRpYSBBUEkgc2Vzc2lvbiB0byBkaXNjb25uZWN0LiAqL1xuZXhwb3J0IGVudW0gTWVldERpc2Nvbm5lY3RSZWFzb24ge1xuICBVTktOT1dOID0gMCxcbiAgQ0xJRU5UX0xFRlQgPSAxLFxuICBVU0VSX1NUT1BQRUQgPSAyLFxuICBDT05GRVJFTkNFX0VOREVEID0gMyxcbiAgU0VTU0lPTl9VTkhFQUxUSFkgPSA0LFxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDI0IEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHtNZWV0TWVkaWFBcGlDbGllbnRJbXBsfSBmcm9tICcuLi9pbnRlcm5hbC9tZWV0bWVkaWFhcGljbGllbnRfaW1wbCc7XG5pbXBvcnQge01lZXRDb25uZWN0aW9uU3RhdGV9IGZyb20gJy4uL3R5cGVzL2VudW1zJztcbmltcG9ydCB7TWVldFN0cmVhbVRyYWNrfSBmcm9tICcuLi90eXBlcy9tZWRpYXR5cGVzJztcbmltcG9ydCB7TWVldFNlc3Npb25TdGF0dXN9IGZyb20gJy4uL3R5cGVzL21lZXRtZWRpYWFwaWNsaWVudCc7XG5cbi8vIEZ1bmN0aW9uIG1hcHMgc2Vzc2lvbiBzdGF0dXMgdG8gc3RyaW5ncy4gSWYgdGhlIHNlc3Npb24gaXMgam9pbmVkLCB3ZSBnb1xuLy8gYWhlYWQgYW5kIHJlcXVlc3QgYSBsYXlvdXQuXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVTZXNzaW9uQ2hhbmdlKHN0YXR1czogTWVldFNlc3Npb25TdGF0dXMpIHtcbiAgbGV0IHN0YXR1c1N0cmluZztcbiAgc3dpdGNoIChzdGF0dXMuY29ubmVjdGlvblN0YXRlKSB7XG4gICAgY2FzZSBNZWV0Q29ubmVjdGlvblN0YXRlLldBSVRJTkc6XG4gICAgICBzdGF0dXNTdHJpbmcgPSAnV0FJVElORyc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIE1lZXRDb25uZWN0aW9uU3RhdGUuSk9JTkVEOlxuICAgICAgc3RhdHVzU3RyaW5nID0gJ0pPSU5FRCc7XG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICBjb25zdCBjbGllbnQgPSAod2luZG93IGFzIGFueSkuY2xpZW50O1xuICAgICAgY29uc3QgbWVkaWFMYXlvdXQgPSBjbGllbnQuY3JlYXRlTWVkaWFMYXlvdXQoe3dpZHRoOiA1MDAsIGhlaWdodDogNTAwfSk7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsaWVudC5hcHBseUxheW91dChbe21lZGlhTGF5b3V0fV0pO1xuICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNZWV0Q29ubmVjdGlvblN0YXRlLkRJU0NPTk5FQ1RFRDpcbiAgICAgIHN0YXR1c1N0cmluZyA9ICdESVNDT05ORUNURUQnO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHN0YXR1c1N0cmluZyA9ICdVTktOT1dOJztcbiAgICAgIGJyZWFrO1xuICB9XG4gIC8vIFVwZGF0ZSBwYWdlIHdpdGggc2Vzc2lvbiBzdGF0dXMuXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXNzaW9uLXN0YXR1cycpIS50ZXh0Q29udGVudCA9XG4gICAgYFNlc3Npb24gU3RhdHVzOiAke3N0YXR1c1N0cmluZ31gO1xufVxuXG5jb25zdCBWSURFT19JRFMgPSBbMSwgMiwgMywgNCwgNSwgNl07XG5jb25zdCBBVURJT19JRFMgPSBbMSwgMiwgM107XG5cbmxldCBhdmFpbGFibGVWaWRlb0lkcyA9IFsuLi5WSURFT19JRFNdO1xubGV0IGF2YWlsYWJsZUF1ZGlvSWRzID0gWy4uLkFVRElPX0lEU107XG5jb25zdCB0cmFja0lkVG9FbGVtZW50SWQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4vLyBDYWxsZWQgd2hlbiB0aGUgTWVldCBzdHJlYW0gY29sbGVjdGlvbiBjaGFuZ2VzICh3aGVuIGEgTWVkaWEgdHJhY2sgaXMgYWRkZWRcbi8vIHRvIG9yIHJlbW92ZWQgZnJvbSB0aGUgcGVlciBjb25uZWN0aW9uKS5cbmZ1bmN0aW9uIGhhbmRsZVN0cmVhbUNoYW5nZShtZWV0U3RyZWFtVHJhY2tzOiBNZWV0U3RyZWFtVHJhY2tbXSkge1xuICAvLyBXZSBjcmVhdGUgbG9jYWwgc2V0cyBvZiBpZHMgc28gdGhhdCB3ZSBkb24ndCBoYXZlIHRvIGFkZCBiYWNrIGlkcyB3aGVuXG4gIC8vIHRyYWNrcyBhcmUgcmVtb3ZlZC5cbiAgY29uc3QgbG9jYWxBdmFpbGFibGVWaWRlb0lkcyA9IG5ldyBTZXQoVklERU9fSURTKTtcbiAgY29uc3QgbG9jYWxBdmFpbGFibGVBdWRpb0lkcyA9IG5ldyBTZXQoQVVESU9fSURTKTtcbiAgbWVldFN0cmVhbVRyYWNrcy5mb3JFYWNoKChtZWV0U3RyZWFtVHJhY2s6IE1lZXRTdHJlYW1UcmFjaykgPT4ge1xuICAgIGlmIChtZWV0U3RyZWFtVHJhY2subWVkaWFTdHJlYW1UcmFjay5raW5kID09PSAndmlkZW8nKSB7XG4gICAgICBjb25zdCBlbGVtZW50SWQgPSB0cmFja0lkVG9FbGVtZW50SWQuZ2V0KFxuICAgICAgICBtZWV0U3RyZWFtVHJhY2subWVkaWFTdHJlYW1UcmFjay5pZCxcbiAgICAgICk7XG4gICAgICBpZiAoZWxlbWVudElkKSB7XG4gICAgICAgIC8vIElmIGEgdHJhY2sgaXMgYWxyZWFkeSBpbiB0aGUgZWxlbWVudCB0aGVuIHdlIHJlbW92ZSBpdCBmcm9tIHRoZSBsb2NhbFxuICAgICAgICAvLyBpZHMgYW5kIGNvbnRpbnVlLlxuICAgICAgICBsb2NhbEF2YWlsYWJsZVZpZGVvSWRzLmRlbGV0ZShlbGVtZW50SWQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBJZiB0aGlzIGlzIGEgbmV3IHRyYWNrLCB0aGVuIHdlIGNyZWF0ZSBhIE1lZGlhU3RyZWFtIGFuZCBhZGQgaXQgdG8gYVxuICAgICAgLy8gdmlkZW8gZWxlbWVudC5cbiAgICAgIGNvbnN0IG1lZGlhU3RyZWFtID0gbmV3IE1lZGlhU3RyZWFtKCk7XG4gICAgICBtZWRpYVN0cmVhbS5hZGRUcmFjayhtZWV0U3RyZWFtVHJhY2subWVkaWFTdHJlYW1UcmFjayk7XG5cbiAgICAgIC8vIFVwZGF0ZSBpZCBjb2xsZWN0aW9ucy4gV2UgZG8gZXhwZWN0IHRvIHJ1biBvdXQgb2YgYXZhaWxhYmxlIGlkcywgYnV0XG4gICAgICAvLyByZWFzc2lnbiB0byBhIHZhbGlkIGlkICgxKSBpbiBjYXNlIHdlIGRvLlxuICAgICAgY29uc3QgdmlkZW9JZCA9IGF2YWlsYWJsZVZpZGVvSWRzLnBvcCgpID8/IDE7XG4gICAgICBsb2NhbEF2YWlsYWJsZVZpZGVvSWRzLmRlbGV0ZSh2aWRlb0lkKTtcblxuICAgICAgLy8gUmV0cmlldmUgYXZhaWxhYmxlIHZpZGVvIGVsZW1lbnQgYW5kIGFzc2lnbiBtZWRpYSBzdHJlYW0gdG8gaXQuXG4gICAgICBjb25zdCB2aWRlb0lkU3RyaW5nID0gYHZpZGVvLSR7dmlkZW9JZH1gO1xuICAgICAgY29uc3QgdmlkZW9FbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodmlkZW9JZFN0cmluZyk7XG4gICAgICAodmlkZW9FbGVtZW50ISBhcyBIVE1MVmlkZW9FbGVtZW50KS5zcmNPYmplY3QgPSBtZWRpYVN0cmVhbTtcbiAgICAgIHRyYWNrSWRUb0VsZW1lbnRJZC5zZXQobWVldFN0cmVhbVRyYWNrLm1lZGlhU3RyZWFtVHJhY2suaWQsIHZpZGVvSWQpO1xuICAgIH0gZWxzZSBpZiAobWVldFN0cmVhbVRyYWNrLm1lZGlhU3RyZWFtVHJhY2sua2luZCA9PT0gJ2F1ZGlvJykge1xuICAgICAgY29uc3QgZWxlbWVudElkID0gdHJhY2tJZFRvRWxlbWVudElkLmdldChcbiAgICAgICAgbWVldFN0cmVhbVRyYWNrLm1lZGlhU3RyZWFtVHJhY2suaWQsXG4gICAgICApO1xuICAgICAgaWYgKGVsZW1lbnRJZCkge1xuICAgICAgICAvLyBJZiBhIHRyYWNrIGlzIGFscmVhZHkgaW4gdGhlIGVsZW1lbnQgdGhlbiB3ZSByZW1vdmUgaXQgZnJvbSB0aGUgbG9jYWxcbiAgICAgICAgLy8gaWRzIGFuZCBjb250aW51ZS5cbiAgICAgICAgbG9jYWxBdmFpbGFibGVBdWRpb0lkcy5kZWxldGUoZWxlbWVudElkKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGlzIGlzIGEgbmV3IHRyYWNrLCB0aGVuIHdlIGNyZWF0ZSBhIE1lZGlhU3RyZWFtIGFuZCBhZGQgaXQgdG8gYVxuICAgICAgLy8gYXVkaW8gZWxlbWVudC5cbiAgICAgIGNvbnN0IG1lZGlhU3RyZWFtID0gbmV3IE1lZGlhU3RyZWFtKCk7XG4gICAgICBtZWRpYVN0cmVhbS5hZGRUcmFjayhtZWV0U3RyZWFtVHJhY2subWVkaWFTdHJlYW1UcmFjayk7XG5cbiAgICAgIC8vIFVwZGF0ZSBpZCBjb2xsZWN0aW9ucy4gV2UgZG8gZXhwZWN0IHRvIHJ1biBvdXQgb2YgYXZhaWxhYmxlIGlkcywgYnV0XG4gICAgICAvLyByZWFzc2lnbiB0byBhIHZhbGlkIGlkICgxKSBpbiBjYXNlIHdlIGRvLlxuICAgICAgY29uc3QgYXVkaW9JZCA9IGF2YWlsYWJsZUF1ZGlvSWRzLnBvcCgpID8/IDE7XG4gICAgICBsb2NhbEF2YWlsYWJsZUF1ZGlvSWRzLmRlbGV0ZShhdWRpb0lkKTtcblxuICAgICAgLy8gUmV0cmlldmUgYXZhaWxhYmxlIGF1ZGlvIGVsZW1lbnQgYW5kIGFzc2lnbiBtZWRpYSBzdHJlYW0gdG8gaXQuXG4gICAgICBjb25zdCBhdWRpb0lkU3RyaW5nID0gYGF1ZGlvLSR7YXVkaW9JZH1gO1xuICAgICAgY29uc3QgYXVkaW9FbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXVkaW9JZFN0cmluZyk7XG4gICAgICAoYXVkaW9FbGVtZW50ISBhcyBIVE1MQXVkaW9FbGVtZW50KS5zcmNPYmplY3QgPSBtZWRpYVN0cmVhbTtcbiAgICAgIHRyYWNrSWRUb0VsZW1lbnRJZC5zZXQobWVldFN0cmVhbVRyYWNrLm1lZGlhU3RyZWFtVHJhY2suaWQsIGF1ZGlvSWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gU2V0IGxvY2FsIHNldCBvZiB0cmFja3MgdG8gdG9wIGxldmVsIGF2YWlsYWJsZSBpZCBjb2xsZWN0aW9ucy5cbiAgYXZhaWxhYmxlVmlkZW9JZHMgPSBbLi4ubG9jYWxBdmFpbGFibGVWaWRlb0lkc107XG4gIGF2YWlsYWJsZUF1ZGlvSWRzID0gWy4uLmxvY2FsQXZhaWxhYmxlQXVkaW9JZHNdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBNZWRpYSBBUEkgY2xpZW50IGFuZCBzdWJzY3JpYmUgdG8gc2Vzc2lvbiBzdGF0dXMgYW5kIG1lZXQgc3RyZWFtXG4gKiBjaGFuZ2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ2xpZW50KFxuICBtZWV0aW5nU3BhY2VJZDogc3RyaW5nLFxuICBudW1iZXJPZlZpZGVvU3RyZWFtczogbnVtYmVyLFxuICBlbmFibGVBdWRpb1N0cmVhbXM6IGJvb2xlYW4sXG4gIGFjY2Vzc1Rva2VuOiBzdHJpbmcsXG4pIHtcbiAgY29uc3QgY2xpZW50ID0gbmV3IE1lZXRNZWRpYUFwaUNsaWVudEltcGwoe1xuICAgIG1lZXRpbmdTcGFjZUlkLFxuICAgIG51bWJlck9mVmlkZW9TdHJlYW1zLFxuICAgIGVuYWJsZUF1ZGlvU3RyZWFtcyxcbiAgICBhY2Nlc3NUb2tlbixcbiAgfSk7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgKHdpbmRvdyBhcyBhbnkpLmNsaWVudCA9IGNsaWVudDtcbiAgY2xpZW50LnNlc3Npb25TdGF0dXMuc3Vic2NyaWJlKGhhbmRsZVNlc3Npb25DaGFuZ2UpO1xuICBjbGllbnQubWVldFN0cmVhbVRyYWNrcy5zdWJzY3JpYmUoaGFuZGxlU3RyZWFtQ2hhbmdlKTtcbiAgY29uc29sZS5sb2coJ01lZGlhIEFQSSBDbGllbnQgY3JlYXRlZC4nKTtcbn1cblxuLyoqXG4gKiBKb2luIG1lZXRpbmcgaWYgY2xpZW50IGV4aXN0c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gam9pbk1lZXRpbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgY29uc3QgY2xpZW50ID0gKHdpbmRvdyBhcyBhbnkpLmNsaWVudDtcbiAgaWYgKCFjbGllbnQpIHJldHVybjtcbiAgY29uc29sZS5sb2coYXdhaXQgY2xpZW50LmpvaW5NZWV0aW5nKCkpO1xufVxuXG4vKipcbiAqIExlYXZlIG1lZXRpbmcgaWYgY2xpZW50IGV4aXN0c1xuICovXG5leHBvcnQgZnVuY3Rpb24gbGVhdmVNZWV0aW5nKCkge1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gIGNvbnNvbGUubG9nKCh3aW5kb3cgYXMgYW55KS5jbGllbnQubGVhdmVNZWV0aW5nKCkpO1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDaGVjayBpZiBtb2R1bGUgZXhpc3RzIChkZXZlbG9wbWVudCBvbmx5KVxuXHRpZiAoX193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0gPT09IHVuZGVmaW5lZCkge1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zY3JpcHQudHNcIik7XG4iLCIiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9