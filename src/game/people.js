import { trimRuntimeArray } from "./runtime.js";

export function createPeopleController({ state, difficultyConfig, limits }) {
  function updatePersonFacing(person) {
    const j = state.jarramplas;
    const dx = j.x - person.x;
    const dy = j.y + j.h * 0.42 - person.y;
    if (Math.abs(dx) > Math.abs(dy) * 1.25) {
      person.facing = "side";
      person.flip = dx < 0;
    } else {
      person.facing = dy < 0 ? "back" : "front";
      person.flip = false;
    }
  }

  function layoutCrowd() {
    for (const person of state.people) updatePersonFacing(person);
  }

  function spawnPerson(initial = false) {
    const config = difficultyConfig[state.difficulty];
    const id = state.nextPersonId;
    state.nextPersonId += 1;
    const fromLeft = Math.random() < 0.5;
    const lane = state.h * (0.53 + Math.random() * 0.13);
    const speed = (36 + Math.random() * 34) * config.speed;
    const size = Math.min(state.w * 0.18, state.h * 0.105, 80) * (0.9 + (id % 3) * 0.05);
    const person = {
      index: id,
      groupId: id,
      x: initial ? Math.random() * state.w : (fromLeft ? -size : state.w + size),
      y: lane,
      vx: fromLeft ? speed : -speed,
      targetY: lane + (Math.random() - 0.5) * state.h * 0.08,
      w: size * 0.62,
      h: size,
      facing: "side",
      flip: false,
      animT: Math.random() * 4,
      throwTimer: 0.5 + Math.random() * 1.2,
      throwAnim: 0,
      throwT: 0,
    };
    updatePersonFacing(person);
    state.people.push(person);
    trimRuntimeArray(state.people, limits.people);
  }

  return { layoutCrowd, spawnPerson, updatePersonFacing };
}
