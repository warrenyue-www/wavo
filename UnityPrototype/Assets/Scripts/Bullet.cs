using UnityEngine;

public class Bullet : MonoBehaviour
{
    public float speed = 14f;
    public float lifeSeconds = 0.85f;
    public int damage = 22;

    private void Start()
    {
        Destroy(gameObject, lifeSeconds);
    }

    private void Update()
    {
        transform.position += transform.right * speed * Time.deltaTime;
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (other.TryGetComponent(out EnemyChaser enemy))
        {
            enemy.TakeDamage(damage);
            Destroy(gameObject);
        }
        else if (other.TryGetComponent(out AsteroidDrifter asteroid))
        {
            asteroid.TakeDamage(damage);
            Destroy(gameObject);
        }
    }
}
