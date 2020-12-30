// fixed parameters
const GRID_WIDTH = 24;
const GRID_CHANNELS = 9;
const FP_SIZE = 2048;

declare var tf;
declare var DeepFragMakeGrid;

/**
 * Loads a remote resource.
 * @param  {string} x  The url.
 * @returns Promise  A promise that is fulfilled when it is loaded.
 */
function get(x: string): Promise<any> {
    return fetch(x).then((x) => x.json());
}

/**
 * Loads the model.
 * @returns Promise  Fulfills when model loaded.
 */
function load_model(): Promise<any> {
    return tf.loadGraphModel("./DeepFrag/model/voxel_web/model.json");
}

/**
 * Runs inference and gets the scores.
 * @param  {*} model         The model.
 * @param  {*} grid          The grid.
 * @param  {*} smiles        The smiles strings.
 * @param  {*} fingerprints  The fingerprints.
 * @returns any[]  The scores.
 */
function run_inference(model: any, grid: any, smiles: any, fingerprints: any): any[] {
    // build tensor from flattened grid
    var tensor = tf.tensor(grid, [
        1,
        GRID_CHANNELS,
        GRID_WIDTH,
        GRID_WIDTH,
        GRID_WIDTH,
    ]);
    var pred = model["predict"](tensor);

    var pred_b = pred["broadcastTo"]([smiles.length, FP_SIZE]);

    // cosine similarity
    // (a dot b) / (|a| * |b|)
    var dot = tf.sum(tf.mul(fingerprints, pred_b), 1);
    var n1 = tf.norm(fingerprints, 2, 1);
    var n2 = tf.norm(pred_b, 2, 1);
    var d = tf.maximum(tf.mul(n1, n2), 1e-6);
    var dist = tf.div(dot, d).arraySync();

    // join smiles with distance
    var scores = [];
    for (var i = 0; i < smiles.length; ++i) {
        scores.push([smiles[i], dist[i]]);
    }

    // sort predictions
    scores.sort((a, b) => b[1] - a[1]);

    return scores;
}

/**
 * Runs deepfrag.
 * @param  {string} receptorPdb    The receptor PDB string.
 * @param  {string} ligandPdb      The ligand PDB string.
 * @param  {Array<number>} center  The location of the growing point.
 * @returns Promise  A promise that fulfills when done. Resolves with scores.
 */
export function runDeepFrag(receptorPdb: string, ligandPdb: string, center: number[]): Promise<any> {
    // Load fingerprints.
    var fingerprintsPromise = get("./DeepFrag/fingerprints.json");

    // Load the model.
    var modelPromise = load_model();

    // Wait for DeepFrag module to load. Hackish.
    var moduleLoadPromise = new Promise((resolve, reject) => {
        var waitForMakeGrid = setInterval(() => {
            if (window["DeepFragMakeGrid"] !== undefined) {
                clearInterval(waitForMakeGrid);
                resolve(window["DeepFragMakeGrid"]);
            }
        }, 500);
    });

    return Promise.all([
        fingerprintsPromise,
        modelPromise,
        moduleLoadPromise,
    ]).then((vals) => {
        let scores;

        // To debug.
        // scores = [["*CC",0.8856948018074036],["*C",0.8234878182411194],["*CCC",0.8039824366569519],["*C(C)C",0.7618820071220398],["*CCCC",0.7330074906349182]];

        if (true) {  // for debugging. put in false to use above dummy scores.
            const fp = vals[0];
            const model = vals[1];

            // Aggregate the fragment fingerprints into a single tensor for
            // vector math.
            var smiles = Object.keys(fp);
            var fpdat = [];
            for (var k = 0; k < smiles.length; k++) {
                fpdat.push(fp[smiles[k]]);
            }
            var fingerprints = tf.tensor(fpdat);

            // Get data required to prepare for grid generation.
            // rec_coords, rec_layers, parent_coords, parent_layers, conn
            let preGridGenData = DeepFragMakeGrid.pre_grid_gen(
                receptorPdb, ligandPdb, center
            );

            // Generate the grids for each channel.
            let grids = [];
            for (let i = 0; i < 9; i++) {
                grids.push(
                    DeepFragMakeGrid.make_grid_given_channel(
                        preGridGenData[0], preGridGenData[1],
                        preGridGenData[2], preGridGenData[3],
                        preGridGenData[4], i
                    )
                );
            }

            // Merge all the channels into one.
            let grid = DeepFragMakeGrid.sum_channel_grids(grids);

            // Run inference. Scores is an array of arrays, [SMILES,
            // score], ordered from best score to worst.
            scores = run_inference(model, grid, smiles, fingerprints);
        }

        // Get values as csv
        let scoresCSV = "Rank,Fragment SMILES,Score\n";
        for (var j = 0; j < scores.length; ++j) {
            scoresCSV += (j + 1).toString() + "," + scores[j][0] + "," + scores[j][1].toString() + "\n";
        }

        return Promise.resolve([scores, scoresCSV]);
    });
}
