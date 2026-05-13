using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 7f;
    public float dashForce = 14f;
    public float dashCooldown = 1.25f;

    [Header("Combat")]
    public Transform firePoint;
    public Bullet bulletPrefab;
    public float fireRate = 0.18f;
    public int damage = 22;

    [Header("State")]
    public int maxHealth = 100;
    public int health = 100;
    public int energy;

    private Rigidbody2D body;
    private Camera mainCamera;
    private float fireTimer;
    private float dashTimer;
    private float invulnerableTimer;

    private void Awake()
    {
        body = GetComponent<Rigidbody2D>();
        mainCamera = Camera.main;
    }

    private void Update()
    {
        AimAtMouse();
        fireTimer -= Time.deltaTime;
        dashTimer -= Time.deltaTime;
        invulnerableTimer -= Time.deltaTime;

        if ((Input.GetMouseButton(0) || Input.GetKey(KeyCode.Space)) && fireTimer <= 0f)
        {
            Shoot();
        }

        if (Input.GetKeyDown(KeyCode.LeftShift) && dashTimer <= 0f)
        {
            Dash();
        }
    }

    private void FixedUpdate()
    {
        Vector2 input = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical")).normalized;
        body.AddForce(input * moveSpeed, ForceMode2D.Force);
        body.linearVelocity *= 0.93f;
    }

    private void AimAtMouse()
    {
        if (mainCamera == null) return;
        Vector3 mouseWorld = mainCamera.ScreenToWorldPoint(Input.mousePosition);
        Vector2 direction = mouseWorld - transform.position;
        float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg;
        body.rotation = angle;
    }

    private void Shoot()
    {
        if (bulletPrefab == null || firePoint == null) return;
        Bullet bullet = Instantiate(bulletPrefab, firePoint.position, firePoint.rotation);
        bullet.damage = damage;
        fireTimer = fireRate;
    }

    private void Dash()
    {
        body.AddForce(transform.right * dashForce, ForceMode2D.Impulse);
        invulnerableTimer = 0.45f;
        dashTimer = dashCooldown;
    }

    public void TakeDamage(int amount)
    {
        if (invulnerableTimer > 0f) return;
        health = Mathf.Max(0, health - amount);
        invulnerableTimer = 0.65f;

        if (health == 0)
        {
            GameManager.Instance.EndRun();
        }
    }

    public void AddEnergy(int amount)
    {
        energy += amount;
        GameManager.Instance.AddScore(10);
    }
}
