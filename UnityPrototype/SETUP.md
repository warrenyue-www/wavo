# Unity Setup

Create a new 2D URP project, then copy `Assets/Scripts` from this folder into the Unity project.

## Scene objects

Create these GameObjects:

- `GameManager`
  - Add `GameManager.cs`
  - Assign the player prefab, enemy prefab, asteroid prefab, pickup prefab, and UI references.
- `Player`
  - Add `Rigidbody2D`
  - Set gravity scale to `0`
  - Add `CircleCollider2D`
  - Add `PlayerController.cs`
- `Bullet` prefab
  - Add `Rigidbody2D`
  - Add `CircleCollider2D`
  - Enable `Is Trigger`
  - Add `Bullet.cs`
- `Enemy` prefab
  - Add `Rigidbody2D`
  - Add `CircleCollider2D`
  - Add `EnemyChaser.cs`
- `Asteroid` prefab
  - Add `Rigidbody2D`
  - Add `CircleCollider2D`
  - Add `AsteroidDrifter.cs`
- `EnergyPickup` prefab
  - Add `CircleCollider2D`
  - Enable `Is Trigger`
  - Add `EnergyPickup.cs`

## Layers and tags

Use tags:

- `Player`
- `Enemy`
- `Asteroid`
- `Pickup`

## First milestone

The first Unity milestone should match the browser prototype:

Fly -> shoot -> survive -> collect energy -> upgrade -> harder wave.
