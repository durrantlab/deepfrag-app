// Copyright 2021 Jacob Durrant

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.


import * as UI from "./UI/UI";
import * as VueSetup from "./Vue/Setup";
import { VERSION } from "./Version";

console.log("DeepFrag Web App " + VERSION);

// @ts-ignore
console.log(__BUILD_TIME__);

declare var ga;

VueSetup.setup();
UI.setup();

// If the url has "durrantlab" in it, contact google analytics. Logging all
// usage would be ideal for grant reporting, but some users may wish to run
// versions of deepfrag on their own servers specifically to maintain privacy
// (e.g., in case of proprietary data). Calls to google analytics in such
// scenarios could be alarming, even though I'm only recording basic
// demographics anyway.
if (window.location.href.indexOf("durrantlab") !== -1) {
    setTimeout(() => {
        // Just to make sure it isn't blocking...
        (function(i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function() {
                (i[r].q = i[r].q || []).push(arguments)
            }, i[r].l = 1 * new Date().getTime();
            a = s.createElement(o);
            m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;
            m.parentNode.insertBefore(a, m)
        })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
        ga('create', 'UA-144382730-1', {
            'name': 'deepfrag'
        });

        // UA-144382730-1 reports to pcaviz account.
        ga('deepfrag.send', {
            "hitType": 'event',
            "eventCategory": 'deepfrag',
            "eventAction": 'pageview',
            "eventLabel": window.location.href
        });
    }, 0)
}
