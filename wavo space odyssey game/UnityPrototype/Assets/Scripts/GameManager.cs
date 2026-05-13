using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("Prefabs")]
    public PlayerController playerPrefab;
    public EnemyChaser enemyPrefab;
    public AsteroidDrifter asteroidPrefab;
    public EnergyPickup pickupPrefab;

    [Header("UI")]
    public TMP_Text waveText;
    public TMP_Text scoreText;
    public TMP_Text hullText;
    public GameObject gameOverPanel;
    public GameObject upgradePanel;

    private PlayerController player;
    private readonly List<EnemyChaser> enemies = new();
    private int wave = 1;
    private int score;

    private void Awake()
    {
        Instance = this;
    }

    private void Start()
    {
        StartRun();
    }

    public void StartRun()
    {
        Time.timeScale = 1f;
        score = 0;
        wave = 1;
        player = Instantiate(playerPrefab, Vector3.zero, Quaternion.identity);
        gameOverPanel?.SetActive(false);
        upgradePanel?.SetActive(false);
        SpawnWave();
        UpdateUi();
    }

    private void Update()
    {
        enemies.RemoveAll(enemy => enemy == null);
        if (enemies.Count == 0 && upgradePanel != null && !upgradePanel.activeSelf)
        {
            upgradePanel.SetActive(true);
            Time.timeScale = 0f;
        }

        UpdateUi();
    }

    public void ChooseUpgrade(int index)
    {
        if (player == null) return;

        if (index == 0) player.fireRate *= 0.8f;
        if (index == 1) player.damage = Mathf.RoundToInt(player.damage * 1.3f);
        if (index == 2) player.moveSpeed *= 1.16f;

        wave++;
        upgradePanel?.SetActive(false);
        Time.timeScale = 1f;
        SpawnWave();
    }

    private void SpawnWave()
    {
        for (int i = 0; i < 4 + wave * 2; i++)
        {
            EnemyChaser enemy = Instantiate(enemyPrefab, RandomEdgePosition(), Quaternion.identity);
            enemy.health += wave * 8;
            enemy.speed += wave * 0.25f;
            enemies.Add(enemy);
        }

        for (int i = 0; i < 4 + wave; i++)
        {
            AsteroidDrifter asteroid = Instantiate(asteroidPrefab, RandomEdgePosition(), Quaternion.identity);
            asteroid.velocity = ((Vector2)Random.insideUnitCircle).normalized * Random.Range(0.7f, 1.9f);
        }
    }

    private Vector3 RandomEdgePosition()
    {
        float x = Random.value < 0.5f ? Random.Range(-11f, 11f) : (Random.value < 0.5f ? -11f : 11f);
        float y = Random.value < 0.5f ? Random.Range(-6f, 6f) : (Random.value < 0.5f ? -6f : 6f);
        return new Vector3(x, y, 0f);
    }

    public void EnemyDestroyed(Vector3 position)
    {
        AddScore(100);
        DropEnergy(position, 3);
    }

    public void AsteroidDestroyed(Vector3 position)
    {
        AddScore(35);
        DropEnergy(position, 2);
    }

    private void DropEnergy(Vector3 position, int count)
    {
        for (int i = 0; i < count; i++)
        {
            Instantiate(pickupPrefab, position + (Vector3)(Random.insideUnitCircle * 0.35f), Quaternion.identity);
        }
    }

    public void AddScore(int amount)
    {
        score += amount;
    }

    public void EndRun()
    {
        gameOverPanel?.SetActive(true);
        Time.timeScale = 0f;
    }

    private void UpdateUi()
    {
        if (waveText != null) waveText.text = $"Wave {wave}";
        if (scoreText != null) scoreText.text = $"Score {score}";
        if (hullText != null && player != null) hullText.text = $"Hull {player.health}/{player.maxHealth}";
    }
}
