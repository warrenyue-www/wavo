using UnityEngine;

public class EnergyPickup : MonoBehaviour
{
    public int value = 4;
    public float magnetRange = 2.2f;
    public float magnetSpeed = 6f;

    private Transform player;

    private void Start()
    {
        player = GameObject.FindGameObjectWithTag("Player")?.transform;
    }

    private void Update()
    {
        if (player == null) return;
        float distance = Vector2.Distance(transform.position, player.position);
        if (distance < magnetRange)
        {
            transform.position = Vector2.MoveTowards(transform.position, player.position, magnetSpeed * Time.deltaTime);
        }
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (other.TryGetComponent(out PlayerController controller))
        {
            controller.AddEnergy(value);
            Destroy(gameObject);
        }
    }
}
