/*
 * (c) 2016-2019 EntIT Software LLC, a Micro Focus company
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

function getOctanePhase(entityType, redmineStatus) {
    return entityType === 'defect' ?
        (redmineStatus === 1 ? 'phase.defect.new' :
            redmineStatus === 2 ? 'phase.defect.opened' :
                redmineStatus === 3 ? 'phase.defect.fixed' :
                    redmineStatus === 4 ? 'phase.defect.proposeclose' :
                        redmineStatus === 5 ? 'phase.defect.closed' :
                            'phase.defect.rejected') :

        entityType === 'feature' ?
            (redmineStatus === 1 ? 'phase.feature.new' :
                redmineStatus === 2 ? 'phase.defect.inprogress' :
                    redmineStatus === 3 ? 'phase.defect.done' :
                        redmineStatus === 4 ? 'phase.defect.inprogress' :
                            redmineStatus === 5 ? 'phase.defect.done' :
                                'phase.defect.inprogress') :
            null;
}

const config = require('read-config')('config.json');
const request = require('request-promise-native');
const util = require('util');

// redmine instance
const redmineOptions = {
    baseUrl: config.redmine.url,
    json: true,
    jar: true,
    auth: config.redmine.auth
};
if (config.redmine.proxy) {
    redmineOptions.proxy = config.redmine.proxy;
}
const redmine = request.defaults(redmineOptions);

// octane instance
const Octane = require('@microfocus/hpe-alm-octane-js-rest-sdk');
const octane = new Octane(config.octane.server);
const authenticateOctane = util.promisify(octane.authenticate.bind(octane));
const getWorkItemRoots = util.promisify(octane.workItemRoots.getAll.bind(octane));
const createDefects = util.promisify(octane.defects.create.bind(octane));
const createFeatures = util.promisify(octane.features.create.bind(octane));

let workItemRootId;

authenticateOctane(config.octane.authorisation)
    .then(() => {
        return getWorkItemRoots({})
            .then(workItemRoots => {
                workItemRootId = workItemRoots[0].id;
                return workItemRootId;
            });
    })
    .then(() => {
        return redmine.get('issues.json');
    })
    .then(issues => {
        let createdPromises = [];
        issues.issues.forEach(issue => {
            let newEntity = {
                name: issue.subject,
                parent: {
                    type: 'work_item',
                    id: workItemRootId
                },
                description: issue.description,
                redmine_id_udf: issue.id,
                phase: {
                    type: 'phase',
                    id: getOctanePhase(issue.tracker.id === 2 ? 'feature' : 'defect', issue.status.id)
                }
            };

            let createMethod = issue.tracker.id === 2 ? createFeatures : createDefects;
            createdPromises.push(createMethod(newEntity));
        });

        return Promise.all(createdPromises);
    })
    .catch(error => {
        console.error('Error! ' + error);
        return error;
    });