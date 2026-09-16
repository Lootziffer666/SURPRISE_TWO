You are a senior game developer specializing in WebGL, Three.js, and modular ES6 JavaScript.
I am building an isometric, hyper-casual 3D resource-management game set in a stylized snowy environment.
Your task is to generate a complete, runnable, multi-file project using Vite and Three.js, including the recommended project structure and foundational implementation for every gameplay system described below.
Do NOT create a single monolithic JavaScript file.
Break the project into logical, reusable ES6 modules and classes with clear responsibilities.
The finished project must run with:
npm install
npm run dev
Use modern JavaScript ES modules and current Three.js APIs.
Do not use React unless absolutely necessary. Prefer vanilla JavaScript, Three.js, HTML, and CSS.
Do not use external GLTF/GLB models yet. All gameplay assets must initially be generated procedurally from Three.js primitives.
Avoid placeholders, TODO comments, pseudo-implementations, and omitted code. Every referenced module, method, class, import, event, and dependency must be implemented.
 
Engine & Scene Architecture

Create at minimum:
GameManager.js
SceneSetup.js
GameManager
"GameManager" should act as the main coordinator for the game.
It should:
initialize the renderer and scene
initialize the camera
create the world
instantiate the player
initialize controllers
initialize inventory
initialize interaction zones
initialize the map manager
initialize the UI
own the main game loop
calculate delta time
update all gameplay systems
render the final scene

Keep dependencies between systems explicit rather than relying on unnecessary global variables.
Camera
Use a strict "THREE.OrthographicCamera".
Position it to create a classic top-down isometric perspective:
elevated above the world
angled downward
approximately 45 degrees around the Y axis
looking toward the player/world center

The camera must smoothly follow the player.
Do NOT rigidly attach the camera to the player.
Instead, maintain a target camera position derived from the player's position and interpolate toward it every frame using delta-time-aware smoothing.
The camera should therefore lag subtly behind the player and create a polished hyper-casual-game feel.
The orthographic camera must correctly adapt to browser resizing without changing the intended visual scale.
Lighting & Shadows
Create:
a "THREE.HemisphereLight" for cool ambient snowy illumination
a strong "THREE.DirectionalLight" acting as the sun

The directional light must cast shadows.
Configure appropriate shadow-map resolution and shadow-camera bounds for the playable area.
Enable shadows on relevant meshes.
Configure the renderer with:
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
Use sensible modern Three.js color-management and tone-mapping settings where appropriate.
Game Loop
Create a robust "requestAnimationFrame" loop.
Use "THREE.Clock" or equivalent timing logic to calculate delta time.
Movement, camera smoothing, rotations, processing timers, animations, resource draining, and other time-dependent systems must be frame-rate independent.
The conceptual update order should be similar to:
read input
→ update player movement
→ update interactions
→ update inventory/processors
→ update map
→ update camera
→ render
Clamp abnormally large delta-time values so returning to a backgrounded browser tab does not cause huge movement jumps.
 
Procedural Asset Generation

Create:
AssetFactory.js
Since no external GLTF models are being loaded yet, implement factory functions that generate stylized low-poly Three.js entities from primitives.
Use simple materials, chunky proportions, flat or low-poly geometry, and strong readable silhouettes.
Every factory method should return a "THREE.Group" or "THREE.Object3D" that can be positioned independently.
Configure meshes to cast and/or receive shadows appropriately.
Player
Create a stylized player using:
a blue capsule-shaped body
simple small arms
simple legs if useful
a small box-shaped backpack attached to the rear
an obvious visual location where the inventory stack can be mounted

Keep the character readable from the isometric camera.
Trees
Create snowy/stylized trees using:
a brown cylindrical trunk
2–3 overlapping green cone sections
optionally small white snow caps

Create slight randomized scale/rotation variation when placing multiple trees.
Bears
Create simple stylized white bears using:
an elongated white box or rounded body
smaller head
four short cylindrical or box-shaped legs
simple dark nose/eyes if useful

The bears can initially be static environmental/gameplay entities.
Resources
Implement procedural meshes for:
Wood
Small brown cylinders/logs.
Raw Meat
Small flat red boxes or slabs.
Cooked Meat
Brown/dark-orange boxes or slabs visually distinguishable from raw meat.
Cash
Small bright green boxes/bundles.
Expose reusable methods such as:
createPlayer()
createTree()
createBear()
createWood()
createRawMeat()
createCookedMeat()
createCash()
createFencePost()
createCampfire()
Resource meshes used by the inventory system should have predictable dimensions so their stack height can be calculated reliably.
 
Player Controller & Movement

Create:
PlayerController.js
Implement smooth player movement.
Support keyboard movement using:
WASD
Arrow Keys
Movement must occur along the X/Z ground plane.
Normalize diagonal movement so moving diagonally is not faster.
Use delta time:
position += direction * speed * deltaTime
Because the camera is isometric, movement should feel intuitive relative to the visible world. If necessary, transform input according to the camera orientation.
Optionally also implement point-and-click/tap movement using "THREE.Raycaster" against the ground plane.
If point-and-click movement is implemented:
convert pointer coordinates to normalized device coordinates
raycast from the orthographic camera
intersect the ground
store the destination
smoothly move toward the destination
stop within a configurable threshold

Manual keyboard input should cancel an active click destination.
Character Rotation
The character must face its movement direction.
Do NOT instantly snap rotation.
Calculate the target orientation from the movement vector and smoothly interpolate using:
Quaternion.slerp()
or an equivalent delta-time-aware quaternion interpolation.
The player should visibly rotate toward the direction they are walking.
Expose useful properties such as:
isMoving
velocity
moveDirection
speed
 
Dynamic Inventory Stacking System

Create:
InventoryStack.js
This is a crucial gameplay system.
The player's inventory must be represented physically and visually as a stack of collected resources attached to the player's back.
Create a dedicated "THREE.Group" attached to the player.
For example:
Player
└── Backpack
└── InventoryStackGroup
├── Resource 1
├── Resource 2
├── Resource 3
└── ...
Collecting Resources
When the player collects a resource:
detect the collection
remove the original resource from the world
determine its resource type
create a visual inventory representation
attach that representation to the player's stack
position it above the previous resource

The transition should feel immediate.
Stack Positioning
Do not use a fixed Y increment for every possible resource.
Determine the resource's height using its geometry/bounding box.
Maintain a cumulative stack height.
For each newly added resource:
newY =
currentStackHeight
half of new item's height

Then update the cumulative height.
Add a small configurable gap between stacked resources.
The stack should be allowed to become comically high.
It should move and rotate naturally with the player because the entire stack group is attached to the player's transform hierarchy.
Inventory Data
Do not treat the stack as visuals only.
Maintain inventory metadata.
Each entry should contain information such as:
{
id,
type,
mesh,
height
}
Support at minimum:
wood
rawMeat
cookedMeat
cash
Expose methods such as:
add(type)
remove(type)
removeTop()
has(type)
count(type)
getItems()
clear()
When an item is removed from the middle of the logical stack, recompute/reflow the positions of all remaining meshes so no visual gaps remain.
 
Resource Collection

Create a lightweight collection system, either inside an appropriate manager or as:
ResourceManager.js
Spawn collectible resources around the map.
Each collectible must contain resource-type metadata.
Use either distance checks or bounding-box intersections between the player and collectible resources.
When the player enters the collection radius:
world resource
→ removed from scene
→ added to InventoryStack
Ensure an item cannot be collected twice.
Structure this system so resource respawning can easily be added later.
 
Interaction & Trigger Zones

Create:
TriggerZone.js
Implement reusable trigger zones using AABB collision detection.
Each trigger should maintain a "THREE.Box3".
Every frame, compare the player's world-space bounding box against active trigger-zone bounds using:
playerBox.intersectsBox(zoneBox)
Support callbacks/events for:
onEnter
onStay
onExit
Do not trigger "onEnter" continuously while the player remains inside.
Provide an optional debug mode that displays transparent trigger-zone meshes or "Box3Helper" objects.
 
Campfire Processing Zone

Create a campfire trigger zone.
If the player enters or remains inside the campfire zone while carrying "rawMeat", process it.
The processing flow should be:
raw meat
→ remove one raw meat
→ wait approximately 1 second
→ create one cooked meat
→ add cooked meat to inventory
Do not process every raw-meat item simultaneously.
Use a processing queue or controlled timer.
Process items one at a time while the player remains inside the campfire zone.
If the player leaves the zone, define sensible behavior:
the currently processing item may finish
no new item should begin processing until the player returns

Create a simple procedural campfire using logs plus glowing orange/red geometry.
Optionally animate the flame using scale/rotation changes.
 
Crowd / Selling Zone

Create a crowd or marketplace trigger zone.
When the player enters this zone while carrying sellable resources, drain those resources from the inventory one at a time.
Sell at minimum:
cookedMeat
wood
Give each resource a configurable sale price, for example:
wood: 5
cookedMeat: 10
Remove resources sequentially with a short delay such as 100–250 ms between items so selling has visible rhythm.
For each sold resource:
remove it from the visual inventory stack
increase the player's cash balance
update the UI
optionally create a green cash block animation

Cash blocks can:
briefly spawn near the selling zone
jump/fly toward the player or HUD
disappear when the cash counter is updated

Do not require physical cash blocks to remain in the player's inventory unless this is useful architecturally.
 
Game State / Economy

Create:
GameState.js
Maintain persistent runtime gameplay state separately from rendering logic.
At minimum:
cash
Expose methods such as:
addCash(amount)
spendCash(amount)
canAfford(amount)
Use a lightweight event/subscriber system or callbacks so UI components can react when cash changes.
Avoid having UI code directly mutate gameplay state.
 
HUD / UI

Create:
UIManager.js
Create HTML/CSS overlays above the WebGL canvas.
Display at minimum:
Cash: $0
Style it like a polished hyper-casual mobile game:
large readable text
rounded panels
strong contrast
subtle shadows
responsive layout
pointer-events configured so UI does not accidentally block gameplay input

The UI should update automatically whenever "GameState.cash" changes.
 
Map Manager

Create:
MapManager.js
Create a stylized snowy starting area.
Terrain
Use a large plane or box with a nearly white/light-blue material.
It must receive shadows.
Add subtle visual variation without external textures where practical.
Scatter environmental assets such as trees around the playable area.
Fence
Bound the initial playable region using procedurally generated wooden fence posts.
Use cylinders or chunky boxes.
Organize fence sections into groups so individual boundaries can later be removed.
For example:
NorthFence
SouthFence
EastFence
WestFence
One fence section must represent the locked expansion boundary.
 
Buy Zone / Map Expansion

Place a "Buy Zone" near the locked fence section.
Create a world-space marker plus an HTML overlay displaying the price, for example:
UNLOCK
$200
The overlay must track the corresponding Three.js world position.
Every frame:
obtain the zone's world position
project it through the camera
convert normalized device coordinates into screen coordinates
position the HTML element accordingly

Hide the label if appropriate when the target is behind the camera or outside the viewport.
Purchasing
Give the expansion a configurable price:
const EXPANSION_COST = 200;
When the player enters the Buy Zone:
if cash >= expansion cost
deduct cash
disable the buy zone
hide/remove the price overlay
animate fence opening
reveal the expansion
The transaction must happen only once.
Use "GameState.canAfford()" and "GameState.spendCash()" rather than directly modifying cash.
 
Fence Opening Animation

Do not instantly delete the locked fence.
Animate the relevant fence posts sinking vertically into the snow.
You may:
implement a lightweight custom tween system
or use a small tweening dependency if justified

Prefer a simple internal tween implementation if the animation is straightforward.
Each post should smoothly interpolate from its starting Y position to a position below the terrain over approximately 0.5–1 second.
Use an easing function such as ease-in-out cubic.
Optionally stagger fence posts slightly for a satisfying sequential effect.
After the animation completes:
hide or remove the fence objects
disable their collision/interaction state
permanently mark the expansion as unlocked

 
Expansion Area / Fishing Pond

Beyond the unlocked fence, reveal a second map area.
Include:
additional snowy terrain
a blue fishing pond
environmental decoration
additional trees/resources if useful

The pond should be a flat blue mesh slightly above the terrain to prevent z-fighting.
Initially hide the expansion area or visually block access to it.
After purchasing the expansion, reveal it.
Optionally animate its appearance with:
scale interpolation
opacity
vertical movement

Keep the implementation simple and robust.
Architect "MapManager" so future expansions can be represented by configuration objects rather than hard-coded rewrites.
For example:
{
id: 'fishingArea',
cost: 200,
unlocked: false,
fenceGroup,
zone,
contentGroup
}
 
World Boundaries

Prevent the player from walking infinitely outside the playable map.
Implement configurable X/Z movement bounds.
Before the fishing area is unlocked, restrict the player to the starting area.
After unlocking it, expand the permitted movement bounds to include the new region.
Structure this so later map expansions can extend the world bounds again.
 
Responsive Rendering

Handle:
window.addEventListener('resize', ...)
Correctly update:
renderer size
device pixel ratio
orthographic camera left/right/top/bottom bounds
projection matrix
HTML world-space overlays

Cap the pixel ratio to avoid excessive GPU cost on high-density mobile screens.
Example:
Math.min(window.devicePixelRatio, 2)
 
Mobile Support

The game should be mobile-friendly.
At minimum:
prevent unwanted page scrolling over the canvas
support touch/pointer events for point-and-click movement
use responsive UI
avoid hover-only interactions

If practical, create an optional virtual joystick or make the pointer movement system work naturally on touch devices.
Use Pointer Events rather than separate mouse/touch implementations where possible.
 
Performance Requirements

Avoid unnecessary allocations inside the main update loop.
Reuse:
THREE.Vector3
THREE.Vector2
THREE.Quaternion
THREE.Box3
where practical.
Do not recreate materials and geometries unnecessarily.
"AssetFactory" should reuse shared geometries/materials where appropriate.
Keep the initial implementation simple enough to support dozens or hundreds of environmental objects.
Structure the code so "InstancedMesh" can later be introduced for trees, fences, and resources if needed.
 
Suggested Architecture

Use a structure similar to:
snow-resource-game/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js
│   ├── styles/
│   │   └── main.css
│   ├── core/
│   │   ├── GameManager.js
│   │   ├── SceneSetup.js
│   │   └── GameState.js
│   ├── entities/
│   │   └── AssetFactory.js
│   ├── controllers/
│   │   └── PlayerController.js
│   ├── inventory/
│   │   └── InventoryStack.js
│   ├── interaction/
│   │   ├── TriggerZone.js
│   │   ├── CampfireProcessor.js
│   │   └── SellingZone.js
│   ├── world/
│   │   ├── MapManager.js
│   │   └── ResourceManager.js
│   ├── ui/
│   │   └── UIManager.js
│   └── utils/
│       ├── Tween.js
│       └── MathUtils.js
└── public/
You may improve this architecture if there is a clear technical reason, but keep responsibilities modular.
 
Gameplay Flow

The prototype should support this complete gameplay loop:
PLAYER SPAWNS
↓
EXPLORE SNOW MAP
↓
COLLECT WOOD / RAW MEAT
↓
ITEMS STACK VISUALLY ON PLAYER'S BACK
↓
TAKE RAW MEAT TO CAMPFIRE
↓
RAW MEAT PROCESSES INTO COOKED MEAT
↓
TAKE WOOD / COOKED MEAT TO CROWD
↓
ITEMS SELL ONE BY ONE
↓
CASH INCREASES
↓
REACH $200
↓
ENTER BUY ZONE
↓
$200 DEDUCTED
↓
FENCE POSTS SINK INTO SNOW
↓
FISHING AREA UNLOCKS
↓
PLAYER CAN ENTER EXPANDED MAP
This entire loop must be playable in the delivered prototype.
 
Code Quality Requirements

Use:
ES6 modules
classes where they make architectural sense
composition instead of unnecessary inheritance
descriptive method/property names
private/internal state where useful
constants/config objects instead of unexplained magic numbers

Avoid:
giant god classes
global mutable variables
duplicated geometry/material creation
frame-dependent movement
repeated event listeners
memory leaks
deprecated Three.js APIs
placeholder implementations

Dispose of temporary Three.js resources where appropriate.
Every import must resolve.
Every referenced method must exist.
The final project should compile without missing modules.
 
Output Requirements

First, output the exact folder/file structure.
Then provide the complete contents of every required file.
At minimum provide complete implementations for:
package.json
index.html
src/main.js
src/styles/main.css
src/core/GameManager.js
src/core/SceneSetup.js
src/core/GameState.js
src/entities/AssetFactory.js
src/controllers/PlayerController.js
src/inventory/InventoryStack.js
src/interaction/TriggerZone.js
src/interaction/CampfireProcessor.js
src/interaction/SellingZone.js
src/world/MapManager.js
src/world/ResourceManager.js
src/ui/UIManager.js
src/utils/Tween.js
Pay particular attention to and provide full implementations for:
SceneSetup.js
PlayerController.js
InventoryStack.js
TriggerZone.js
MapManager.js
GameManager.js
AssetFactory.js
Do not omit supporting files required for these modules to work.
For every file:
print the file path as a heading
provide the entire file in a code block
do not replace repeat

USE THE PROVIDED SKILLS IN CLAUDE-CODE GAME-STUDIO-ZIP
