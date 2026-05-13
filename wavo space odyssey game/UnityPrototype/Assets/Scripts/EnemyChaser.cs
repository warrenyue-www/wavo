using UnityEngine;

public class EnemyChaser : MonoBehaviour
{
    public int health = 35;
    public float speed = 3.2f;
    public int contactDamage = 14;

    private Transform player;

    private void Start()
    {
        player = GameObject.FindGameObjectWithTag("Player")?.transform;
    }

    private void Update()
    {
        if (player == null) return;
        Vector2 direction = (player.position - transform.position).normalized;
        transform.position += (Vector3)(direction * speed * Time.deltaTime);
        transform.right = direction;
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.collider.TryGetComponent(out PlayerController controller))
        {
            controller.TakeDamage(contactDamage);
            TakeDamage(35);
        }
    }

    public void TakeDamage(int amount)
    {
        health -= amount;
        if (health <= 0)
        {
            GameManager.Instance.EnemyDestroyed(transform.position);
            Destroy(gameObject);
        }
    }
}
